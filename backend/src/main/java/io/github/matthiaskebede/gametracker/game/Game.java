package io.github.matthiaskebede.gametracker.game;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import io.github.matthiaskebede.gametracker.entry.Entry;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;

/**
 * A game in the library, independent of platform. Per-platform data (playtime,
 * backlog status) lives on {@link Entry}.
 */
@Entity
public class Game {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	private String series;

	// Personal rating from 1 to 10, or null if unrated. The column is SMALLINT, so
	// Hibernate is told the SQL type explicitly (an Integer maps to INTEGER by default).
	@JdbcTypeCode(SqlTypes.SMALLINT)
	private Integer rating;

	// Hibernate converts camelCase field names to snake_case columns (cover_image_url).
	@Column(columnDefinition = "text")
	private String coverImageUrl;

	// The next three fields are filled by the IGDB and Steam milestones.
	private Long igdbId;

	private Long steamAppId;

	private Instant metadataFetchedAt;

	// "mappedBy" says the foreign key lives on Entry.game. Cascade and orphanRemoval
	// make entries follow their game: saving or deleting a game does the same to them.
	@OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id")
	private List<Entry> entries = new ArrayList<>();

	protected Game() {
	}

	public Game(String name) {
		this.name = name;
	}

	public Long getId() {
		return this.id;
	}

	public String getName() {
		return this.name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getSeries() {
		return this.series;
	}

	public void setSeries(String series) {
		this.series = series;
	}

	public Integer getRating() {
		return this.rating;
	}

	public void setRating(Integer rating) {
		this.rating = rating;
	}

	public String getCoverImageUrl() {
		return this.coverImageUrl;
	}

	public Long getIgdbId() {
		return this.igdbId;
	}

	public Long getSteamAppId() {
		return this.steamAppId;
	}

	public Instant getMetadataFetchedAt() {
		return this.metadataFetchedAt;
	}

	public List<Entry> getEntries() {
		return this.entries;
	}

	// Keeps both sides of the relationship in step: the list here and Entry.game.
	public void addEntry(Entry entry) {
		entry.setGame(this);
		this.entries.add(entry);
	}

	public void removeEntry(Entry entry) {
		this.entries.remove(entry);
	}

}
