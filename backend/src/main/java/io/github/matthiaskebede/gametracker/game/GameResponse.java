package io.github.matthiaskebede.gametracker.game;

import java.util.List;

import io.github.matthiaskebede.gametracker.entry.EntryResponse;

/**
 * JSON shape of a game in API responses, including its per-platform entries.
 */
public record GameResponse(Long id, String name, String series, Integer rating, String coverImageUrl,
		List<EntryResponse> entries) {

	static GameResponse from(Game game) {
		return new GameResponse(game.getId(), game.getName(), game.getSeries(), game.getRating(),
				game.getCoverImageUrl(), game.getEntries().stream().map(EntryResponse::from).toList());
	}

}
