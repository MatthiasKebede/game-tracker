package io.github.matthiaskebede.gametracker;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.UnsupportedEncodingException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import com.jayway.jsonpath.JsonPath;

/**
 * HTTP-level tests for the entry endpoints. Like GameApiTests, these commit
 * for real and empty the game table before every test.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class EntryApiTests {

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbcClient;

	private long gameId;

	@BeforeEach
	void createGame() {
		this.jdbcClient.sql("DELETE FROM game").update();
		this.gameId = idOf(post("/api/games", """
				{"name": "Celeste", "rating": 8}
				"""));
	}

	@Test
	void addedEntryAppearsOnItsGame() {
		MvcTestResult created = addEntry("Switch", "PLAYING", 90);

		assertThat(created).hasStatus(HttpStatus.CREATED);
		assertThat(created).bodyJson().extractingPath("$.gameId").isEqualTo((int) this.gameId);
		assertThat(created).bodyJson().extractingPath("$.platformName").isEqualTo("Switch");
		assertThat(created).bodyJson().extractingPath("$.playtimeSource").isEqualTo("MANUAL");

		MvcTestResult game = getGame();
		assertThat(game).bodyJson().extractingPath("$.entries").asArray().hasSize(1);
		assertThat(game).bodyJson().extractingPath("$.entries[0].id").isEqualTo((int) idOf(created));
		assertThat(game).bodyJson().extractingPath("$.entries[0].status").isEqualTo("PLAYING");
		assertThat(game).bodyJson().extractingPath("$.entries[0].playtimeMinutes").isEqualTo(90);
	}

	@Test
	void playtimeDefaultsToZero() {
		MvcTestResult created = post(entriesUri(), """
				{"platformId": %d, "status": "NOT_STARTED"}
				""".formatted(platformId("Steam")));

		assertThat(created).hasStatus(HttpStatus.CREATED);
		assertThat(created).bodyJson().extractingPath("$.playtimeMinutes").isEqualTo(0);
	}

	@Test
	void sameGameCanBeOnTwoPlatformsWithSeparateData() {
		addEntry("Switch", "FINISHED", 600);
		addEntry("Steam", "NOT_STARTED", 0);

		MvcTestResult game = getGame();
		assertThat(game).bodyJson()
			.extractingPath("$.entries[*].platformName")
			.asArray()
			.containsExactly("Switch", "Steam");
		assertThat(game).bodyJson()
			.extractingPath("$.entries[*].playtimeMinutes")
			.asArray()
			.containsExactly(600, 0);
		// The rating is stored once on the game, not per entry.
		assertThat(game).bodyJson().extractingPath("$.rating").isEqualTo(8);
	}

	@Test
	void duplicatePlatformIsRejectedWithConflict() {
		addEntry("Switch", "FINISHED", 600);

		MvcTestResult duplicate = addEntry("Switch", "PLAYING", 5);

		assertThat(duplicate).hasStatus(HttpStatus.CONFLICT);
		assertThat(duplicate).bodyJson().extractingPath("$.detail").asString().contains("Switch");
		// The original entry is untouched.
		assertThat(getGame()).bodyJson().extractingPath("$.entries[*].playtimeMinutes").asArray().containsExactly(600);
	}

	@Test
	void updateChangesStatusAndPlaytime() {
		long entryId = idOf(addEntry("Switch", "PLAYING", 90));

		MvcTestResult updated = put("/api/entries/" + entryId, """
				{"status": "FINISHED", "playtimeMinutes": 480}
				""");
		assertThat(updated).hasStatusOk();

		MvcTestResult game = getGame();
		assertThat(game).bodyJson().extractingPath("$.entries[0].status").isEqualTo("FINISHED");
		assertThat(game).bodyJson().extractingPath("$.entries[0].playtimeMinutes").isEqualTo(480);
		assertThat(game).bodyJson().extractingPath("$.entries[0].platformName").isEqualTo("Switch");
	}

	@Test
	void deleteRemovesOnlyThatEntry() {
		long switchEntry = idOf(addEntry("Switch", "FINISHED", 600));
		addEntry("Steam", "NOT_STARTED", 0);

		assertThat(this.mvc.delete().uri("/api/entries/{id}", switchEntry)).hasStatus(HttpStatus.NO_CONTENT);

		assertThat(getGame()).hasStatusOk()
			.bodyJson()
			.extractingPath("$.entries[*].platformName")
			.asArray()
			.containsExactly("Steam");
	}

	@Test
	void invalidBodiesAreRejected() {
		long steam = platformId("Steam");

		assertThat(post(entriesUri(), """
				{"status": "PLAYING"}
				""")).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().extractingPath("$.errors.platformId").isNotNull();
		assertThat(post(entriesUri(), """
				{"platformId": %d}
				""".formatted(steam))).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors.status")
			.isNotNull();
		assertThat(post(entriesUri(), """
				{"platformId": %d, "status": "PLAYING", "playtimeMinutes": -1}
				""".formatted(steam))).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors.playtimeMinutes")
			.isNotNull();
		// A status that is not one of the enum values fails while parsing the JSON.
		assertThat(post(entriesUri(), """
				{"platformId": %d, "status": "ABANDONED"}
				""".formatted(steam))).hasStatus(HttpStatus.BAD_REQUEST);

		assertThat(getGame()).bodyJson().extractingPath("$.entries").asArray().isEmpty();
	}

	@Test
	void invalidUpdateLeavesEntryUnchanged() {
		long entryId = idOf(addEntry("Switch", "PLAYING", 90));

		assertThat(put("/api/entries/" + entryId, """
				{"status": "FINISHED", "playtimeMinutes": -5}
				""")).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(put("/api/entries/" + entryId, """
				{"status": "FINISHED"}
				""")).hasStatus(HttpStatus.BAD_REQUEST);

		MvcTestResult game = getGame();
		assertThat(game).bodyJson().extractingPath("$.entries[0].status").isEqualTo("PLAYING");
		assertThat(game).bodyJson().extractingPath("$.entries[0].playtimeMinutes").isEqualTo(90);
	}

	@Test
	void unknownIdsReturnNotFound() {
		assertThat(post("/api/games/999999/entries", """
				{"platformId": %d, "status": "PLAYING"}
				""".formatted(platformId("Steam")))).hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("Game 999999 not found");
		assertThat(post(entriesUri(), """
				{"platformId": 999999, "status": "PLAYING"}
				""")).hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("Platform 999999 not found");
		assertThat(put("/api/entries/999999", """
				{"status": "FINISHED", "playtimeMinutes": 1}
				""")).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(this.mvc.delete().uri("/api/entries/999999")).hasStatus(HttpStatus.NOT_FOUND);
	}

	private String entriesUri() {
		return "/api/games/" + this.gameId + "/entries";
	}

	private MvcTestResult addEntry(String platformName, String status, int playtimeMinutes) {
		return post(entriesUri(), """
				{"platformId": %d, "status": "%s", "playtimeMinutes": %d}
				""".formatted(platformId(platformName), status, playtimeMinutes));
	}

	private MvcTestResult getGame() {
		return this.mvc.get().uri("/api/games/{id}", this.gameId).exchange();
	}

	private MvcTestResult post(String uri, String json) {
		return this.mvc.post().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json).exchange();
	}

	private MvcTestResult put(String uri, String json) {
		return this.mvc.put().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json).exchange();
	}

	private long platformId(String name) {
		return this.jdbcClient.sql("SELECT id FROM platform WHERE name = ?").param(name).query(Long.class).single();
	}

	private static long idOf(MvcTestResult result) {
		try {
			Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
			return id.longValue();
		}
		catch (UnsupportedEncodingException ex) {
			throw new IllegalStateException(ex);
		}
	}

}
