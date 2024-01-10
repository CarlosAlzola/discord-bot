const { Client, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.DISCORD_TOKEN;
const apiKey = process.env.TMDB_API_KEY;
const guildId = process.env.GUILD_ID;

const commands = [
  {
    name: 'pelicula',
    description: 'Busca información sobre una película.',
    type: 1,
    options: [
      {
        name: 'nombre',
        description: 'Nombre de la película a buscar.',
        type: 3,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '9' }).setToken(token);

client.once('ready', async () => {
  try {
    console.log('Bot conectado. Registrando comandos...');

    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands },
    );

    console.log('Comandos registrados exitosamente!');
  } catch (error) {
    console.error('Error al registrar comandos:', error.message);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'pelicula') {
    const movieName = options.getString('nombre');

    try {
      const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
        params: {
          api_key: apiKey,
          query: movieName,
        },
      });

      if (response.data.results.length > 0) {
        const movie = response.data.results[0];

        const genreResponse = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
          params: {
            api_key: apiKey,
          },
        });

        const genreMap = {};
        genreResponse.data.genres.forEach(genre => {
          genreMap[genre.id] = genre.name;
        });

        const genreNames = movie.genre_ids.map(genreId => genreMap[genreId]);

        const embed = {
          title: movie.title,
          description: movie.overview,
          image: {
            url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          },
          fields: [
            { name: 'Año de lanzamiento', value: movie.release_date, inline: true },
            { name: 'Géneros', value: genreNames.join(', '), inline: true },
            { name: 'Idioma original', value: movie.original_language, inline: true },
            { name: 'Adulto', value: movie.adult ? 'Sí' : 'No', inline: true },
            { name: 'Calificación promedio', value: movie.vote_average.toString(), inline: true },
            { name: 'Número de votos', value: movie.vote_count.toString(), inline: true },
          ],
        };

        interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply('No se encontró ninguna película con ese nombre.');
      }
    } catch (error) {
      console.error('Error al buscar la película:', error.message);
      interaction.reply('Se produjo un error al buscar la película. Por favor, intenta de nuevo más tarde.');
    }
  }
});

client.login(token);

//usar Node bot.js en la terminal para activar//