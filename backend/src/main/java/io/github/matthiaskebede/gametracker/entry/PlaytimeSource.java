package io.github.matthiaskebede.gametracker.entry;

/**
 * Where an entry's playtime came from. A Steam playtime update only touches
 * entries whose source is STEAM. Must match the CHECK constraint on
 * entry.playtime_source.
 */
public enum PlaytimeSource {

	MANUAL, STEAM

}
