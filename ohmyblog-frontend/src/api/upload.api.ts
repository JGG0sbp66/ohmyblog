// src/api/upload.api.ts
import { api, unwrap } from "./client";
import type {
  TUploadAvatarDTO,
  TUploadHeroDTO,
  TUploadIconDTO,
  TUploadPostCoverDTO,
  TUploadPostImageDTO,
  TUploadSocialIconDTO,
} from "@server/dtos/upload.dto";

/**
 * POST /upload/favicon
 * 上传网站图标
 */
export const uploadFavicon = (data: TUploadIconDTO) => {
  return unwrap(api.api.upload.favicon.post(data));
};

/**
 * POST /upload/hero
 * 上传首页横幅
 */
export const uploadHero = (data: TUploadHeroDTO) => {
  return unwrap(api.api.upload.hero.post(data));
};

/**
 * POST /upload/avatar
 * 上传头像
 */
export const uploadAvatar = (data: TUploadAvatarDTO) => {
  return unwrap(api.api.upload.avatar.post(data));
};

/**
 * POST /upload/social-icon
 * 上传社交图标
 */
export const uploadSocialIcon = (data: TUploadSocialIconDTO) => {
  return unwrap(api.api.upload["social-icon"].post(data));
};

/**
 * POST /upload/post-cover/:uuid
 * 上传文章封面图
 */
export const uploadPostCover = (uuid: string, data: TUploadPostCoverDTO) => {
  return unwrap(api.api.upload["post-cover"]({ uuid }).post(data));
};

/**
 * POST /upload/post-image/:uuid
 * 上传文章插图
 */
export const uploadPostImage = (uuid: string, data: TUploadPostImageDTO) => {
  return unwrap(api.api.upload["post-image"]({ uuid }).post(data));
};
