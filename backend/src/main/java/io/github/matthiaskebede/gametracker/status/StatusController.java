package io.github.matthiaskebede.gametracker.status;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minimal endpoint that proves the web layer, dependency injection, and the
 * database connection all work together.
 */
@RestController
@RequestMapping("/api/status")
public class StatusController {

	private final JdbcClient jdbcClient;

	private final String applicationName;

	// Spring calls this constructor and supplies both arguments (constructor injection).
	public StatusController(JdbcClient jdbcClient, @Value("${spring.application.name}") String applicationName) {
		this.jdbcClient = jdbcClient;
		this.applicationName = applicationName;
	}

	@GetMapping
	public StatusResponse getStatus() {
		long platformCount = this.jdbcClient.sql("SELECT COUNT(*) FROM platform").query(Long.class).single();
		return new StatusResponse(this.applicationName, platformCount);
	}

	// A record is an immutable data class. Spring serializes it to JSON automatically.
	public record StatusResponse(String application, long platformCount) {
	}

}
