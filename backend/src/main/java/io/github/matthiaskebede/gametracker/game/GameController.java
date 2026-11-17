package io.github.matthiaskebede.gametracker.game;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * HTTP layer for games: maps URLs and JSON to service calls and nothing else.
 */
@RestController
@RequestMapping("/api/games")
public class GameController {

	private final GameService gameService;

	public GameController(GameService gameService) {
		this.gameService = gameService;
	}

	@GetMapping
	public List<GameResponse> listGames() {
		return this.gameService.listGames();
	}

	@GetMapping("/{id}")
	public GameResponse getGame(@PathVariable Long id) {
		return this.gameService.getGame(id);
	}

	// @RequestBody parses the JSON body into a GameRequest. @Valid runs its validation annotations.
	@PostMapping
	public ResponseEntity<GameResponse> createGame(@Valid @RequestBody GameRequest request) {
		GameResponse created = this.gameService.createGame(request);
		// 201 Created, with a Location header pointing at the new game.
		return ResponseEntity.created(URI.create("/api/games/" + created.id())).body(created);
	}

	@PutMapping("/{id}")
	public GameResponse updateGame(@PathVariable Long id, @Valid @RequestBody GameRequest request) {
		return this.gameService.updateGame(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteGame(@PathVariable Long id) {
		this.gameService.deleteGame(id);
	}

}
