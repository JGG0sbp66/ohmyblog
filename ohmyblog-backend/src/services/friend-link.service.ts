// src/services/friend-link.service.ts
import { friendLinkDao } from "../daos/friend-link.dao";
import { emailSenderService } from "./email/email-sender.service";
import type {
	TApplyFriendLinkDTO,
	TFriendLinkQueryDTO,
	TRejectFriendLinkDTO,
	TUpdateFriendLinkDTO,
} from "../dtos/friend-link.dto";

class FriendLinkService {
	/**
	 * 前台：获取所有已通过的友链
	 */
	async getApprovedList() {
		return friendLinkDao.findApproved();
	}

	/**
	 * 管理员：分页获取友链列表
	 */
	async getList(query: TFriendLinkQueryDTO) {
		return friendLinkDao.findAll(query);
	}

	/**
	 * 管理员：获取单条友链详情
	 */
	async getById(uuid: string) {
		return friendLinkDao.findById(uuid);
	}

	/**
	 * 前台：提交友链申请（状态默认 pending）
	 */
	async apply(data: TApplyFriendLinkDTO) {
		const item = await friendLinkDao.create({
			name: data.name,
			url: data.url,
			avatarUrl: data.avatarUrl,
			description: data.description,
			tags: data.tags,
			applicantEmail: data.applicantEmail,
			status: "pending",
		});

		// 静默通知管理员（SMTP 未配置时不影响主流程）
		emailSenderService
			.sendFriendLinkApplyNotify({
				siteName: data.name,
				siteUrl: data.url,
				siteDescription: data.description,
				siteTags: data.tags,
				applicantEmail: data.applicantEmail,
			})
			.catch(() => {});

		// 静默给申请人发送"已收到申请"确认邮件
		if (data.applicantEmail) {
			emailSenderService
				.sendFriendLinkApplyConfirm({
					to: data.applicantEmail,
					applicantSiteName: data.name,
				})
				.catch(() => {});
		}

		return item;
	}

	/**
	 * 管理员：审批通过，自动写入入驻时间
	 */
	async approve(uuid: string) {
		const item = await friendLinkDao.update(uuid, {
			status: "approved",
			rejectReason: null,
			joinedAt: new Date(),
		});

		// 静默通知申请人
		if (item?.applicantEmail) {
			emailSenderService
				.sendFriendLinkResult({
					to: item.applicantEmail,
					applicantSiteName: item.name,
					result: "approved",
				})
				.catch(() => {});
		}

		return item;
	}

	/**
	 * 管理员：拒绝申请
	 */
	async reject(uuid: string, body: TRejectFriendLinkDTO) {
		const item = await friendLinkDao.update(uuid, {
			status: "rejected",
			rejectReason: body.rejectReason ?? null,
		});

		// 静默通知申请人
		if (item?.applicantEmail) {
			emailSenderService
				.sendFriendLinkResult({
					to: item.applicantEmail,
					applicantSiteName: item.name,
					result: "rejected",
					rejectReason: body.rejectReason,
				})
				.catch(() => {});
		}

		return item;
	}

	/**
	 * 管理员：更新友链信息
	 */
	async update(uuid: string, data: TUpdateFriendLinkDTO) {
		return friendLinkDao.update(uuid, {
			...data,
			joinedAt: data.joinedAt != null ? new Date(data.joinedAt * 1000) : data.joinedAt,
		});
	}

	/**
	 * 管理员：删除友链
	 */
	async delete(uuid: string) {
		return friendLinkDao.delete(uuid);
	}

	/**
	 * 仪表盘：待审批友链数量
	 */
	async countPending() {
		return friendLinkDao.countPending();
	}
}

export const friendLinkService = new FriendLinkService();
