package io.github.matthiaskebede.gametracker;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.UnsupportedEncodingException;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
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

import jakarta.persistence.EntityManagerFactory;

/**
 * HTTP-level tests for /api/games. These are not transactional, so each
 * request commits like it would in the running app. The game table is emptied
 * before every test instead.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class GameApiTests {

	@Autowired
	private MockMvcTester mvc;

	@Autowired
	private JdbcClient jdbcClient;

	@Autowired
	private EntityManagerFactory entityManagerFactory;

	@BeforeEach
	void deleteAllGames() {
		// Entries go too, through ON DELETE CASCADE.
		this.jdbcClient.sql("DELETE FROM game").update();
	}

	@Test
	void createdGameCanBeFetched() {
		MvcTestResult created = postGame("""
				{"name": "Hades", "series": "Hades", "rating": 9}
				""");

		assertThat(created).hasStatus(HttpStatus.CREATED);
		long id = idOf(created);
		assertThat(created).headers().hasValue("Location", "/api/games/" + id);

		MvcTestResult fetched = this.mvc.get().uri("/api/games/{id}", id).exchange();
		assertThat(fetched).hasStatusOk();
		assertThat(fetched).bodyJson().extractingPath("$.name").isEqualTo("Hades");
		assertThat(fetched).bodyJson().extractingPath("$.series").isEqualTo("Hades");
		assertThat(fetched).bodyJson().extractingPath("$.rating").isEqualTo(9);
		assertThat(fetched).bodyJson().extractingPath("$.entries").asArray().isEmpty();
	}

	@Test
	void seriesAndRatingAreOptional() {
		MvcTestResult created = postGame("""
				{"name": "  Tetris  ", "series": "   "}
				""");

		assertThat(created).hasStatus(HttpStatus.CREATED);
		// The name is trimmed and a blank series is stored as null.
		assertThat(created).bodyJson().extractingPath("$.name").isEqualTo("Tetris");
		assertThat(created).bodyJson().extractingPath("$.series").isNull();
		assertThat(created).bodyJson().extractingPath("$.rating").isNull();
	}

	@Test
	void gamesAreListedByName() {
		postGame("""
				{"name": "Portal"}
				""");
		postGame("""
				{"name": "Celeste"}
				""");

		assertThat(this.mvc.get().uri("/api/games")).hasStatusOk()
			.bodyJson()
			.extractingPath("$[*].name")
			.asArray()
			.containsExactly("Celeste", "Portal");
	}

	@Test
	void listIncludesEntriesAndUsesOneQuery() {
		long celeste = idOf(postGame("""
				{"name": "Celeste"}
				"""));
		long portal = idOf(postGame("""
				{"name": "Portal"}
				"""));
		insertEntry(celeste, "Switch", 600, "FINISHED");
		insertEntry(celeste, "Steam", 0, "NOT_STARTED");
		insertEntry(portal, "Steam", 240, "COMPLETED");

		Statistics statistics = this.entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
		statistics.setStatisticsEnabled(true);
		statistics.clear();

		MvcTestResult list = this.mvc.get().uri("/api/games").exchange();

		// Guards against the N+1 problem: the count must not grow with the number of games.
		assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
		statistics.setStatisticsEnabled(false);

		assertThat(list).hasStatusOk();
		assertThat(list).bodyJson().extractingPath("$[0].entries[*].platformName").asArray().containsExactly("Switch",
				"Steam");
		assertThat(list).bodyJson().extractingPath("$[0].entries[0].playtimeMinutes").isEqualTo(600);
		assertThat(list).bodyJson().extractingPath("$[0].entries[0].status").isEqualTo("FINISHED");
		assertThat(list).bodyJson().extractingPath("$[0].entries[0].playtimeSource").isEqualTo("MANUAL");
		assertThat(list).bodyJson().extractingPath("$[1].entries[*].platformName").asArray().containsExactly("Steam");
	}

	@Test
	void updateReplacesNameSeriesAndRating() {
		long id = idOf(postGame("""
				{"name": "Hades", "series": "Hades", "rating": 9}
				"""));

		MvcTestResult updated = this.mvc.put()
			.uri("/api/games/{id}", id)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"name": "Hades II", "rating": 10}
					""")
			.exchange();
		assertThat(updated).hasStatusOk();

		// Fetch again to check the change was actually saved, not only echoed back.
		MvcTestResult fetched = this.mvc.get().uri("/api/games/{id}", id).exchange();
		assertThat(fetched).bodyJson().extractingPath("$.name").isEqualTo("Hades II");
		assertThat(fetched).bodyJson().extractingPath("$.series").isNull();
		assertThat(fetched).bodyJson().extractingPath("$.rating").isEqualTo(10);
	}

	@Test
	void deleteRemovesGameAndItsEntries() {
		long id = idOf(postGame("""
				{"name": "Portal"}
				"""));
		insertEntry(id, "Steam", 240, "COMPLETED");

		assertThat(this.mvc.delete().uri("/api/games/{id}", id)).hasStatus(HttpStatus.NO_CONTENT);

		assertThat(this.mvc.get().uri("/api/games/{id}", id)).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(this.jdbcClient.sql("SELECT COUNT(*) FROM entry").query(Long.class).single()).isZero();
	}

	@Test
	void blankNameIsRejectedWithFieldError() {
		MvcTestResult result = postGame("""
				{"name": "  "}
				""");

		assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(result).bodyJson().extractingPath("$.errors.name").isNotNull();
		assertThat(this.jdbcClient.sql("SELECT COUNT(*) FROM game").query(Long.class).single()).isZero();
	}

	@Test
	void ratingOutOfRangeIsRejected() {
		assertThat(postGame("""
				{"name": "Low", "rating": 0}
				""")).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().extractingPath("$.errors.rating").isNotNull();
		assertThat(postGame("""
				{"name": "High", "rating": 11}
				""")).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().extractingPath("$.errors.rating").isNotNull();
	}

	@Test
	void boundaryRatingsAreAccepted() {
		assertThat(postGame("""
				{"name": "Low", "rating": 1}
				""")).hasStatus(HttpStatus.CREATED);
		assertThat(postGame("""
				{"name": "High", "rating": 10}
				""")).hasStatus(HttpStatus.CREATED);
	}

	@Test
	void malformedJsonIsRejected() {
		assertThat(postGame("{\"name\": ")).hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void invalidUpdateLeavesGameUnchanged() {
		long id = idOf(postGame("""
				{"name": "Hades", "rating": 9}
				"""));

		assertThat(this.mvc.put().uri("/api/games/{id}", id).contentType(MediaType.APPLICATION_JSON).content("""
				{"name": "", "rating": 3}
				""")).hasStatus(HttpStatus.BAD_REQUEST);

		MvcTestResult fetched = this.mvc.get().uri("/api/games/{id}", id).exchange();
		assertThat(fetched).bodyJson().extractingPath("$.name").isEqualTo("Hades");
		assertThat(fetched).bodyJson().extractingPath("$.rating").isEqualTo(9);
	}

	@Test
	void unknownGameReturnsNotFound() {
		assertThat(this.mvc.get().uri("/api/games/999999")).hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("Game 999999 not found");
		assertThat(this.mvc.put().uri("/api/games/999999").contentType(MediaType.APPLICATION_JSON).content("""
				{"name": "Ghost"}
				""")).hasStatus(HttpStatus.NOT_FOUND);
		assertThat(this.mvc.delete().uri("/api/games/999999")).hasStatus(HttpStatus.NOT_FOUND);
	}

	private MvcTestResult postGame(String json) {
		return this.mvc.post().uri("/api/games").contentType(MediaType.APPLICATION_JSON).content(json).exchange();
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

	// Entries are inserted with SQL here so these tests do not depend on the entry endpoints.
	private void insertEntry(long gameId, String platformName, int playtimeMinutes, String status) {
		this.jdbcClient
			.sql("""
					INSERT INTO entry (game_id, platform_id, playtime_minutes, status)
					SELECT ?, id, ?, ? FROM platform WHERE name = ?
					""")
			.params(gameId, playtimeMinutes, status, platformName)
			.update();
	}

}
