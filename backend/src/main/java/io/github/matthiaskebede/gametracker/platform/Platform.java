package io.github.matthiaskebede.gametracker.platform;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * A platform games can be owned on. Rows are seeded by a Flyway migration and
 * are read-only from the application's point of view, so there are no setters.
 */
@Entity
public class Platform {

	// IDENTITY means the database generates the id, matching the identity column in the migration.
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 50)
	private String name;

	// JPA requires a no-argument constructor. Protected keeps application code from using it.
	protected Platform() {
	}

	public Long getId() {
		return this.id;
	}

	public String getName() {
		return this.name;
	}

}
