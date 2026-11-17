package io.github.matthiaskebede.gametracker.game;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data derives the query from each method name. @EntityGraph tells it
 * to load the entries and their platforms in the same SQL query. Without it,
 * each game's entries would be loaded by a separate query (the "N+1" problem).
 */
public interface GameRepository extends JpaRepository<Game, Long> {

	@EntityGraph(attributePaths = { "entries", "entries.platform" })
	List<Game> findAllByOrderByNameAsc();

	@EntityGraph(attributePaths = { "entries", "entries.platform" })
	Optional<Game> findWithEntriesById(Long id);

}
