package io.github.matthiaskebede.gametracker.game;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.github.matthiaskebede.gametracker.error.NotFoundException;

/**
 * Business logic for games. Each public method runs in one database
 * transaction: it either completes fully or changes nothing. Entities are
 * converted to response records here, while the transaction is still open,
 * because lazy relationships cannot be loaded after it closes.
 */
@Service
@Transactional
public class GameService {

	private final GameRepository gameRepository;

	public GameService(GameRepository gameRepository) {
		this.gameRepository = gameRepository;
	}

	@Transactional(readOnly = true)
	public List<GameResponse> listGames() {
		return this.gameRepository.findAllByOrderByNameAsc().stream().map(GameResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public GameResponse getGame(Long id) {
		return GameResponse.from(findGame(id));
	}

	public GameResponse createGame(GameRequest request) {
		Game game = new Game(request.name().strip());
		game.setSeries(normalize(request.series()));
		game.setRating(request.rating());
		return GameResponse.from(this.gameRepository.save(game));
	}

	public GameResponse updateGame(Long id, GameRequest request) {
		Game game = findGame(id);
		game.setName(request.name().strip());
		game.setSeries(normalize(request.series()));
		game.setRating(request.rating());
		// No save call is needed: Hibernate tracks loaded entities and writes the
		// changes when the transaction commits ("dirty checking").
		return GameResponse.from(game);
	}

	public void deleteGame(Long id) {
		this.gameRepository.delete(findGame(id));
	}

	private Game findGame(Long id) {
		return this.gameRepository.findWithEntriesById(id)
			.orElseThrow(() -> new NotFoundException("Game " + id + " not found"));
	}

	// Stores a missing or blank series as null so there is one representation of "none".
	private static String normalize(String value) {
		return (value == null || value.isBlank()) ? null : value.strip();
	}

}
