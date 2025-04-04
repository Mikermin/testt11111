// DOM Elements
const pokeContainer = document.getElementById("poke-container");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const loadMoreButton = document.getElementById("load-more");

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
};
const mainTypes = Object.keys(colors);

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
        <small class="type">Type: <span>${type}</span></small>
    </div>
    `;
  
  pokemonElement.innerHTML = pokemonInnerHTML;
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

// Search for a specific Pokemon
const searchPokemon = async () => {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (!searchTerm) return;
  
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
  
  // Clear search input
  searchInput.value = "";
  
  // Remove reset button if it exists
  const resetContainer = document.querySelector(".reset-container");
  if (resetContainer) {
    resetContainer.remove();
  }
  
  fetchPokemons();
};

// Event listeners
loadMoreButton.addEventListener("click", fetchPokemons);

searchButton.addEventListener("click", searchPokemon);

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    searchPokemon();
  }
});

// Load first batch on page load
document.addEventListener("DOMContentLoaded", fetchPokemons);
