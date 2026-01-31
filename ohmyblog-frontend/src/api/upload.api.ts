// src/api/upload.api.ts
import { api, unwrap } from "./client";

/**
 * POST /upload/favicon
 * 上传网站图标
 */
export const uploadFavicon = (icon: File) => {
  return unwrap(
    api.api.upload.favicon.post({
      icon,
    }),
  );
};

/**
 * POST /upload/hero
 * 上传首页横幅
 */
export const uploadHero = (hero: File) => {
  return unwrap(
    api.api.upload.hero.post({
      hero,
    }),
  );
};

/**
 * POST /upload/avatar
 * 上传头像
 */
export const uploadAvatar = (avatar: File) => {
  return unwrap(
    api.api.upload.avatar.post({
      avatar,
    }),
  );
};
