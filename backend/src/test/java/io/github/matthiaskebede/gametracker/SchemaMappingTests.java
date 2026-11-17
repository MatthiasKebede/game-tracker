package io.github.matthiaskebede.gametracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.matthiaskebede.gametracker.entry.BacklogStatus;
import io.github.matthiaskebede.gametracker.entry.Entry;
import io.github.matthiaskebede.gametracker.entry.PlaytimeSource;
import io.github.matthiaskebede.gametracker.game.Game;
import io.github.matthiaskebede.gametracker.game.GameRepository;
import io.github.matthiaskebede.gametracker.platform.Platform;
import io.github.matthiaskebede.gametracker.platform.PlatformRepository;
import jakarta.persistence.EntityManager;

/**
 * Checks that the entities and the V2 migration agree, including the database
 * constraints. Each test runs in a transaction that is rolled back afterwards,
 * so tests do not see each other's rows.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SchemaMappingTests {

	@Autowired
	private GameRepository gameRepository;

	@Autowired
	private PlatformRepository platformRepository;

	@Autowired
	private EntityManager entityManager;

	@Autowired
	private JdbcClient jdbcClient;

	@Test
	void gameWithEntryIsSavedAndReadBack() {
		Game game = new Game("Hollow Knight");
		game.setSeries("Hollow Knight");
		game.setRating(9);
		game.addEntry(new Entry(platform("Switch"), BacklogStatus.PLAYING, 90));
		Long id = this.gameRepository.saveAndFlush(game).getId();
		// Clear Hibernate's cache so the next read really comes from the database.
		this.entityManager.clear();

		Game loaded = this.gameRepository.findById(id).orElseThrow();

		assertThat(loaded.getName()).isEqualTo("Hollow Knight");
		assertThat(loaded.getSeries()).isEqualTo("Hollow Knight");
		assertThat(loaded.getRating()).isEqualTo(9);
		assertThat(loaded.getEntries()).singleElement().satisfies((entry) -> {
			assertThat(entry.getPlatform().getName()).isEqualTo("Switch");
			assertThat(entry.getStatus()).isEqualTo(BacklogStatus.PLAYING);
			assertThat(entry.getPlaytimeMinutes()).isEqualTo(90);
			assertThat(entry.getPlaytimeSource()).isEqualTo(PlaytimeSource.MANUAL);
		});
	}

	@Test
	void sameGameOnTwoPlatformsIsAllowed() {
		Game game = new Game("Celeste");
		game.addEntry(new Entry(platform("Switch"), BacklogStatus.FINISHED, 600));
		game.addEntry(new Entry(platform("Steam"), BacklogStatus.NOT_STARTED, 0));

		this.gameRepository.saveAndFlush(game);

		assertThat(entryCount(game)).isEqualTo(2);
	}

	@Test
	void secondEntryForSameGameAndPlatformIsRejected() {
		Game game = new Game("Celeste");
		game.addEntry(new Entry(platform("Switch"), BacklogStatus.FINISHED, 600));
		game.addEntry(new Entry(platform("Switch"), BacklogStatus.PLAYING, 0));

		assertThatThrownBy(() -> this.gameRepository.saveAndFlush(game))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void ratingOutsideOneToTenIsRejected() {
		Game game = new Game("Overrated");
		game.setRating(11);

		assertThatThrownBy(() -> this.gameRepository.saveAndFlush(game))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void negativePlaytimeIsRejected() {
		Game game = new Game("Time Travel");
		game.addEntry(new Entry(platform("Steam"), BacklogStatus.PLAYING, -1));

		assertThatThrownBy(() -> this.gameRepository.saveAndFlush(game))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void deletingGameDeletesItsEntries() {
		Game game = new Game("Short Lived");
		game.addEntry(new Entry(platform("3DS"), BacklogStatus.DROPPED, 15));
		this.gameRepository.saveAndFlush(game);
		assertThat(entryCount(game)).isEqualTo(1);

		this.gameRepository.delete(game);
		this.gameRepository.flush();

		assertThat(entryCount(game)).isZero();
	}

	private Platform platform(String name) {
		return this.platformRepository.findAll()
			.stream()
			.filter((platform) -> platform.getName().equals(name))
			.findFirst()
			.orElseThrow();
	}

	// Counts with plain SQL so the assertion does not depend on the JPA mapping under test.
	private long entryCount(Game game) {
		return this.jdbcClient.sql("SELECT COUNT(*) FROM entry WHERE game_id = ?")
			.param(game.getId())
			.query(Long.class)
			.single();
	}

}
