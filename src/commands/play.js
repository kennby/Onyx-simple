// Importando las bibliotecas necesarias
import fs from "fs"; // Biblioteca para operaciones de sistema de archivos
import path from "path"; // Biblioteca para manejar rutas de archivos y directorios
import yts from "yt-search"; // Biblioteca para realizar búsquedas en YouTube
import youtubeDl from "youtube-dl-exec";
import ffmpeg from "@ffmpeg-installer/ffmpeg";

// Exportando un objeto que contiene la lógica del comando "play"
export default {
  name: "play",
  alias: ["reproduce", "p"],

  // Función principal del comando
  run: async (socket, msg, args) => {
    try {
      // Obtiene el nombre de la canción de los argumentos proporcionados
      const name = args.join(" ");

      // Verifica si se proporcionó un nombre de canción
      if (!name) {
        // Si no se proporciona un nombre, envía un mensaje de error
        socket.sendMessage(msg.messages[0]?.key.remoteJid, {
          text: "Ingresa el nombre de la canción.",
        });

        return;
      }

      // Crea una ruta para el archivo de audio en el directorio temporal del sistema
      const dir = path.resolve("src", "temp", `SONG_${Date.now()}.`);

      // Envia un mensaje de espera al usuario
      socket.sendMessage(msg.messages[0]?.key.remoteJid, {
        react: { text: "⏳", key: msg.messages[0]?.key },
      });

      // Realiza una búsqueda en YouTube para encontrar el video correspondiente a la canción
      const video = (await yts(name)).all.find((i) => i.type === "video");

      // Verifica si se encontró un video correspondiente a la búsqueda
      if (!video) {
        // Si no se encuentra un video, envía un mensaje de error
        await socket.sendMessage(msg.messages[0]?.key.remoteJid, {
          text: "Sin resultados.",
        });

        // Envia una reacción de error al usuario
        socket.sendMessage(msg.messages[0]?.key.remoteJid, {
          react: { text: "❌", key: msg.messages[0]?.key },
        });

        return;
      }

      // Verifica si la duración del video no supera los 20 minutos (1200 segundos)
      if (video.seconds > 1200) {
        // Si el video es demasiado largo, envía un mensaje de error
        await socket.sendMessage(msg.messages[0]?.key.remoteJid, {
          text: "El vídeo no debe superar los 20 minutos.",
        });

        // Envia una reacción de error al usuario
        socket.sendMessage(msg.messages[0]?.key.remoteJid, {
          react: { text: "❌", key: msg.messages[0]?.key },
        });

        return;
      }

      // Envía información del video al usuario (título, autor, duración y vistas)
      socket.sendMessage(msg.messages[0]?.key.remoteJid, {
        image: { url: video.image }, // URL de la imagen en miniatura del video
        caption: `*${video.title}*\n\n*Autor:* ${video.author.name}\n*Duración:* ${video.timestamp}\n*Vistas:* ${video.views}`, // Información del video formateada
      });

      await youtubeDl(video.url, {
        ffmpegLocation: ffmpeg.path,
        extractAudio: true,
        addMetadata: true,
        output: dir + "%(ext)s",
      });

      await socket.sendMessage(msg.messages[0]?.key.remoteJid, {
        audio: { url: dir + "opus" }, // Contenido del audio
        mimetype: "audio/mp4", // Tipo de archivo de audio
      });

      // Envia una reacción de éxito al usuario
      socket.sendMessage(msg.messages[0]?.key.remoteJid, {
        react: { text: "✅", key: msg.messages[0]?.key },
      });

      // Elimina el archivo de audio del directorio temporal después de enviarlo
      fs.promises.unlink(dir + "opus");
    } catch (error) {
      // Manejo de errores: imprime el error en la consola y envía un mensaje de error al usuario
      console.error(error);

      await socket.sendMessage(msg.messages[0]?.key.remoteJid, {
        text: "¡Ups! Sucedió un error.",
      });

      // Envia una reacción de error al usuario
      socket.sendMessage(msg.messages[0]?.key.remoteJid, {
        react: { text: "❌", key: msg.messages[0]?.key },
      });
    }
  },
};
