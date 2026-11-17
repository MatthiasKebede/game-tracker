package io.github.matthiaskebede.gametracker;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.matthiaskebede.gametracker.status.StatusController;
import io.github.matthiaskebede.gametracker.status.StatusController.StatusResponse;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class GameTrackerApplicationTests {

	@Autowired
	private JdbcClient jdbcClient;

	@Autowired
	private StatusController statusController;

	@Test
	void migrationSeedsPlatforms() {
		List<String> names = this.jdbcClient.sql("SELECT name FROM platform").query(String.class).list();

		assertThat(names).containsExactlyInAnyOrder("Steam", "Xbox", "Switch", "Wii U", "3DS", "Emulator");
	}

	@Test
	void statusReportsApplicationNameAndPlatformCount() {
		StatusResponse status = this.statusController.getStatus();

		assertThat(status.application()).isEqualTo("game-tracker");
		assertThat(status.platformCount()).isEqualTo(6);
	}

}
