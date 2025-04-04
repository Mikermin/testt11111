// DOM Elements
const pokeContainer = document.getElementById("poke-container");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const loadMoreButton = document.getElementById("load-more");
const typeFilter = document.getElementById("type-filter");

// Configuration
const pokemonsPerLoad = 20;
let currentOffset = 0;
const totalToLoad = 250;
const baseUrl = "https://pokeapi.co/api/v2";

// Simple cache implementation
const cache = {};

// Colors for different Pokemon types
const colors = {
  fire: "#FDDFDF",
  grass: "#DEFDE0",
  electric: "#FCF7DE",
  water: "#DEF3FD",
  ground: "#f4e7da",
  rock: "#d5d5d4",
  fairy: "#fceaff",
  poison: "#98d7a5",
  bug: "#f8d5a3",
  dragon: "#97b3e6",
  psychic: "#eaeda1",
  flying: "#F5F5F5",
  fighting: "#E6E0D4",
  normal: "#F5F5F5",
  ice: "#DEF3FD",
  ghost: "#705898",
  dark: "#705848",
  steel: "#B8B8D0",
};
const mainTypes = Object.keys(colors);

// To store all fetched Pokemon for filtering
let allPokemons = [];

// Create modal element
const createModal = () => {
  // Check if modal already exists
  if (document.getElementById("pokemon-modal")) {
    return;
  }
  
  const modal = document.createElement("div");
  modal.id = "pokemon-modal";
  modal.className = "modal";
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <div id="modal-pokemon-details">
        <!-- Pokemon details will be inserted here -->
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listener to close modal when clicking the X
  document.querySelector(".close-modal").addEventListener("click", closeModal);
  
  // Close modal when clicking outside the content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close modal when pressing Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });
};

// Open modal with Pokemon details
const openPokemonModal = (pokemon) => {
  const modal = document.getElementById("pokemon-modal") || createModal();
  const modalContent = document.getElementById("modal-pokemon-details");
  
  // Format data
  const name = pokemon.name[0].toUpperCase() + pokemon.name.slice(1);
  const id = pokemon.id.toString().padStart(3, "0");
  
  // Create abilities list
  const abilities = pokemon.abilities
    .map(ability => {
      const abilityName = ability.ability.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return `${abilityName}${ability.is_hidden ? ' (Hidden)' : ''}`;
    })
    .join(", ");
  
  // Create type badges
  const typeBadges = pokemon.types.map(typeObj => {
    const typeName = typeObj.type.name;
    const color = colors[typeName] || "#A8A878";
    return `<span class="type-badge" style="background-color: ${color}">${typeName}</span>`;
  }).join("");
  
  // Create stats HTML
  const statsHTML = pokemon.stats.map(stat => {
    const statName = formatStatName(stat.stat.name);
    const statValue = stat.base_stat;
    const maxStat = 255; // Max possible base stat
    const percentage = (statValue / maxStat) * 100;
    
    return `
      <div class="stat-item">
        <span class="stat-name">${statName}</span>
        <span class="stat-value">${statValue}</span>
        <div class="stat-bar">
          <div class="stat-progress" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
  
  // Get Pokemon sprite URL
  const spriteUrl = pokemon.sprites.other["official-artwork"].front_default || 
                    pokemon.sprites.front_default;
  
  // Get main type for header color
  const mainType = pokemon.types[0].type.name;
  const headerColor = colors[mainType] || "#A8A878";
  
  // Create modal content
  modalContent.innerHTML = `
    <div class="modal-header" style="background-color: ${headerColor}30">
      <div style="display: flex; align-items: center;">
        <img class="pokemon-image" src="${spriteUrl}" alt="${name}">
        <h2>${name} <span style="color: #777;">#${id}</span></h2>
      </div>
      <div>${typeBadges}</div>
    </div>
    
    <div class="modal-body">
      <div class="modal-section">
        <h4>Basic Information</h4>
        <div><strong>Height:</strong> ${pokemon.height / 10}m</div>
        <div><strong>Weight:</strong> ${pokemon.weight / 10}kg</div>
        <div><strong>Base Experience:</strong> ${pokemon.base_experience || 'N/A'}</div>
      </div>
      
      <div class="modal-section">
        <h4>Abilities</h4>
        <div>${abilities}</div>
      </div>
      
      <div class="modal-section">
        <h4>Base Stats</h4>
        ${statsHTML}
      </div>
      
      <div class="modal-section">
        <h4>Moves</h4>
        <div>${pokemon.moves.slice(0, 5).map(move => 
          move.move.name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        ).join(", ")}${pokemon.moves.length > 5 ? ` and ${pokemon.moves.length - 5} more...` : ''}</div>
      </div>
    </div>
  `;
  
  // Display modal
  modal.style.display = "block";
};

// Close modal
const closeModal = () => {
  const modal = document.getElementById("pokemon-modal");
  if (modal) {
    modal.style.display = "none";
  }
};

// Fetch with caching
async function fetchWithCache(url) {
  if (cache[url]) {
    return cache[url];
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  cache[url] = data;
  return data;
}

// Format stat name
const formatStatName = (statName) => {
  if (statName === "hp") return "HP";
  if (statName === "special-attack") return "Sp. Atk";
  if (statName === "special-defense") return "Sp. Def";
  return statName.split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Create type badges HTML
const createTypeBadges = (types) => {
  return types.map(typeObj => {
    const typeName = typeObj.type.name;
    const color = colors[typeName] || "#A8A878";
    return `<span class="type-badge" style="background-color: ${color}">${typeName}</span>`;
  }).join("");
};

// Create and add a Pokemon card to the container
const createPokemonCard = (pokemon) => {
  const pokemonElement = document.createElement("div");
  pokemonElement.classList.add("pokemon");
  
  const name = pokemon.name[0].toUpperCase() + pokemon.name.slice(1);
  const id = pokemon.id.toString().padStart(3, "0");
  
  const pokeTypes = pokemon.types.map((typeObj) => typeObj.type.name);
  const type = mainTypes.find((type) => pokeTypes.indexOf(type) > -1) || 'normal';
  const color = colors[type];
  
  pokemonElement.style.backgroundColor = color;
  
  const pokemonInnerHTML = `
    <div class="img-container">
        <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png"
            alt="${name}"
        />
    </div>
    <div class="info">
        <span class="number">#${id}</span>
        <h3 class="name">${name}</h3>
        <small class="type">Type: ${createTypeBadges(pokemon.types)}</small>
    </div>
  `;
  
  pokemonElement.innerHTML = pokemonInnerHTML;
  
  // Add click event to open modal
  pokemonElement.addEventListener("click", () => {
    openPokemonModal(pokemon);
  });
  
  pokeContainer.appendChild(pokemonElement);
};

// Fetch a single Pokemon by ID or name
const getPokemon = async (identifier) => {
  try {
    const pokemon = await fetchWithCache(`${baseUrl}/pokemon/${identifier.toLowerCase()}`);
    createPokemonCard(pokemon);
    return pokemon;
  } catch (error) {
    console.error(`Error fetching Pokemon ${identifier}:`, error);
    throw error;
  }
};

// Fetch multiple Pokemon with pagination
const fetchPokemons = async () => {
  try {
    // Show loading state
    loadMoreButton.textContent = "Loading...";
    loadMoreButton.disabled = true;
    
    // Get list of Pokemon
    const response = await fetchWithCache(`${baseUrl}/pokemon?limit=${pokemonsPerLoad}&offset=${currentOffset}`);
    
    // Get details for each Pokemon
    const detailPromises = response.results.map(p => fetchWithCache(`${baseUrl}/pokemon/${p.name}`));
    const pokemonDetails = await Promise.all(detailPromises);
    
    // Save all fetched pokemons
    allPokemons = [...allPokemons, ...pokemonDetails];
    
    // Create cards for each Pokemon
    pokemonDetails.forEach(createPokemonCard);
    
    // Update offset for next load
    currentOffset += pokemonsPerLoad;
    
    // Reset button state
    loadMoreButton.textContent = "Load More";
    loadMoreButton.disabled = false;
    
    // Hide load more button if we've reached the total
    if (currentOffset >= totalToLoad) {
      loadMoreButton.style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching Pokemon list:", error);
    loadMoreButton.textContent = "Try Again";
    loadMoreButton.disabled = false;
  }
};

// Filter pokemons by name and type
const filterPokemons = () => {
  // Get search term and type filter
  const searchTerm = searchInput.value.toLowerCase().trim();
  const typeFilter = document.getElementById("type-filter").value;
  
  // Clear the container
  pokeContainer.innerHTML = "";
  
  // Filter Pokemon
  const filteredPokemon = allPokemons.filter(pokemon => {
    // Match by name
    const nameMatch = pokemon.name.toLowerCase().includes(searchTerm);
    
    // Match by type if a type filter is selected
    let typeMatch = true;
    if (typeFilter) {
      typeMatch = pokemon.types.some(t => t.type.name === typeFilter);
    }
    
    return nameMatch && typeMatch;
  });
  
  if (filteredPokemon.length === 0) {
    pokeContainer.innerHTML = `<p class="error">No Pokémon found matching your criteria</p>`;
  } else {
    // Display filtered Pokemon
    filteredPokemon.forEach(createPokemonCard);
  }
  
  // Show reset button
  showResetButton();
  
  // Hide load more button during filtered results
  loadMoreButton.style.display = "none";
};

// Search for a specific Pokemon
const searchPokemon = async () => {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const typeFilterValue = typeFilter.value;
  
  // If we have pokemon data already fetched, use the filter function instead
  if (allPokemons.length > 0) {
    filterPokemons();
    return;
  }
  
  // If no data fetched yet and no search term, just return
  if (!searchTerm && !typeFilterValue) return;
  
  try {
    // Clear the container
    pokeContainer.innerHTML = "";
    
    // Try to fetch the Pokemon
    await getPokemon(searchTerm);
    
    // Hide load more button during search results
    loadMoreButton.style.display = "none";
    
    // Show reset button
    showResetButton();
  } catch (error) {
    console.error("Error searching for Pokemon:", error);
    pokeContainer.innerHTML = `<p class="error">Couldn't find a Pokémon named "${searchTerm}"</p>`;
    
    // Show reset button
    showResetButton();
  }
};

// Show reset button
const showResetButton = () => {
  // Only create if it doesn't exist
  if (!document.getElementById("reset-search")) {
    const resetButton = document.createElement("button");
    resetButton.id = "reset-search";
    resetButton.textContent = "Show All Pokemon";
    resetButton.className = "reset-button";
    resetButton.addEventListener("click", resetAndLoad);
    
    const container = document.createElement("div");
    container.className = "reset-container";
    container.appendChild(resetButton);
    
    // Add after the poke container
    const pagination = document.querySelector(".pagination");
    document.body.insertBefore(container, pagination);
  }
};

// Reset to initial state and load first batch
const resetAndLoad = () => {
  pokeContainer.innerHTML = "";
  currentOffset = 0;
  loadMoreButton.style.display = "block";
  
  // Clear search input and type filter
  searchInput.value = "";
  typeFilter.value = "";
  
  // Remove reset button if it exists
  const resetContainer = document.querySelector(".reset-container");
  if (resetContainer) {
    resetContainer.remove();
  }
  
  fetchPokemons();
};

// Event listeners
loadMoreButton.addEventListener("click", fetchPokemons);

searchButton.addEventListener("click", () => {
  // If we already have data, filter it
  if (allPokemons.length > 0) {
    filterPokemons();
  } else {
    searchPokemon();
  }
});

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    if (allPokemons.length > 0) {
      filterPokemons();
    } else {
      searchPokemon();
    }
  }
});

// Add event listener for type filter changes
typeFilter.addEventListener("change", () => {
  if (allPokemons.length > 0) {
    filterPokemons();
  }
});

// Create modal element
createModal();

// Load first batch on page load
document.addEventListener("DOMContentLoaded", fetchPokemons);
