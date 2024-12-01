import { createCanvas, loadImage } from 'canvas';
import { palestineTimezone } from '../config.js';
import moment from 'moment-timezone';

export async function createWelcomeImage(member, customMessage) {
  const canvas = createCanvas(700, 250);
  const ctx = canvas.getContext('2d');

  // Background
  const background = await loadImage('/path/to/background.jpg');
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Welcome text
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(`مرحباً بك في ${member.guild.name}!`, canvas.width / 2, 80);

  // Custom message
  if (customMessage) {
    ctx.font = '25px Arial';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText(customMessage, canvas.width / 2, 120);
  }

  // Member name
  ctx.font = '30px Arial';
  ctx.fillStyle = '#7289DA';
  ctx.fillText(member.user.tag, canvas.width / 2, 160);

  // Member count
  ctx.font = '25px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`أنت العضو رقم #${member.guild.memberCount}`, canvas.width / 2, 200);

  // Time in Palestine
  const palestineTime = moment().tz(palestineTimezone).format('HH:mm:ss');
  ctx.font = '20px Arial';
  ctx.fillStyle = '#7289DA';
  ctx.fillText(`الوقت في فلسطين: ${palestineTime}`, canvas.width / 2, 230);

  // Avatar
  const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 128 }));
  ctx.save();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 300, 64, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, canvas.width / 2 - 64, 236, 128, 128);
  ctx.restore();

  return canvas.toBuffer();
}

