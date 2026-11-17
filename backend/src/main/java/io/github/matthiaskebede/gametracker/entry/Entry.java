package io.github.matthiaskebede.gametracker.entry;

import io.github.matthiaskebede.gametracker.game.Game;
import io.github.matthiaskebede.gametracker.platform.Platform;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/**
 * One game on one platform, with the playtime and backlog status for that
 * platform. The same game on two platforms has two entries.
 */
@Entity
public class Entry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// LAZY means the game is only loaded from the database when it is first used.
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "game_id", nullable = false)
	private Game game;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "platform_id", nullable = false)
	private Platform platform;

	@Column(nullable = false)
	private int playtimeMinutes;

	// STRING stores the enum name ("PLAYING"). The default would store its position
	// (1), which breaks silently if the enum values are ever reordered.
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private BacklogStatus status;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private PlaytimeSource playtimeSource = PlaytimeSource.MANUAL;

	protected Entry() {
	}

	public Entry(Platform platform, BacklogStatus status, int playtimeMinutes) {
		this.platform = platform;
		this.status = status;
		this.playtimeMinutes = playtimeMinutes;
	}

	public Long getId() {
		return this.id;
	}

	public Game getGame() {
		return this.game;
	}

	// Called by Game.addEntry, which keeps both sides of the relationship in step.
	public void setGame(Game game) {
		this.game = game;
	}

	public Platform getPlatform() {
		return this.platform;
	}

	public int getPlaytimeMinutes() {
		return this.playtimeMinutes;
	}

	public void setPlaytimeMinutes(int playtimeMinutes) {
		this.playtimeMinutes = playtimeMinutes;
	}

	public BacklogStatus getStatus() {
		return this.status;
	}

	public void setStatus(BacklogStatus status) {
		this.status = status;
	}

	public PlaytimeSource getPlaytimeSource() {
		return this.playtimeSource;
	}

}
