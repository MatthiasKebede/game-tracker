package io.github.matthiaskebede.gametracker;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * HTTP-level tests for the read-only endpoints. MockMvcTester sends requests
 * through Spring's web layer (routing, JSON conversion) without opening a real
 * network port.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class ReferenceDataApiTests {

	@Autowired
	private MockMvcTester mvc;

	@Test
	void platformsAreListedInSeedOrder() {
		assertThat(this.mvc.get().uri("/api/platforms")).hasStatusOk()
			.bodyJson()
			.extractingPath("$[*].name")
			.asArray()
			.containsExactly("Steam", "Xbox", "Switch", "Wii U", "3DS", "Emulator");
	}

	@Test
	void platformsHaveIds() {
		assertThat(this.mvc.get().uri("/api/platforms")).hasStatusOk()
			.bodyJson()
			.extractingPath("$[0].id")
			.isNotNull();
	}

	@Test
	void statusIsServedOverHttp() {
		assertThat(this.mvc.get().uri("/api/status")).hasStatusOk()
			.bodyJson()
			.extractingPath("$.application")
			.isEqualTo("game-tracker");
	}

	@Test
	void unknownPathReturnsNotFound() {
		assertThat(this.mvc.get().uri("/api/does-not-exist")).hasStatus(HttpStatus.NOT_FOUND);
	}

}
