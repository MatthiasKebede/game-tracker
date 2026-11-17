package io.github.matthiaskebede.gametracker.entry;

/**
 * Backlog state of one entry. The names are stored as text in the database and
 * must match the CHECK constraint on entry.status.
 */
public enum BacklogStatus {

	NOT_STARTED, PLAYING, FINISHED, COMPLETED, DROPPED

}
