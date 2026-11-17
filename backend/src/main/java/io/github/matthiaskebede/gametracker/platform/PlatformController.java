package io.github.matthiaskebede.gametracker.platform;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only reference data. There is no service class here because there are
 * no business rules: the controller only reads and converts.
 */
@RestController
@RequestMapping("/api/platforms")
public class PlatformController {

	private final PlatformRepository platformRepository;

	public PlatformController(PlatformRepository platformRepository) {
		this.platformRepository = platformRepository;
	}

	@GetMapping
	public List<PlatformResponse> listPlatforms() {
		// Sorted by id so the order matches the order of the seed data.
		return this.platformRepository.findAll(Sort.by("id")).stream().map(PlatformResponse::from).toList();
	}

	// The DTO (data transfer object) returned as JSON, kept separate from the entity.
	public record PlatformResponse(Long id, String name) {

		static PlatformResponse from(Platform platform) {
			return new PlatformResponse(platform.getId(), platform.getName());
		}

	}

}
