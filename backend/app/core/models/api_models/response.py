"""统一 API 响应模型

设计目标:
1. 标准化成功/失败响应结构，便于前端统一处理
2. 提供明确的错误码枚举，支持扩展分段
3. 保留扩展字段 `extra` 以满足特殊场景

返回 JSON 结构示例:
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": { ... },
  "extra": {"request_id": "..."}
}

失败示例:
{
  "success": false,
  "code": 100101,
  "message": "用户名不存在",
  "data": null,
  "errors": [
      {"field": "username", "message": "用户名不存在"}
  ]
}
"""
from __future__ import annotations

from enum import IntEnum
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field


class ErrorCode(IntEnum):
    """错误码规范:
    建议分段: XYZZZZ
    X: 模块大类 (1=通用,2=用户,3=帖子,4=评论 ...)
    Y: 子模块/领域
    ZZZZ: 具体错误序号
    0 保留为成功
    """

    SUCCESS = 0

    # 通用 (10xxxx)
    COMMON_INVALID_PARAM = 100001
    COMMON_UNAUTHORIZED = 100002
    COMMON_FORBIDDEN = 100003
    COMMON_NOT_FOUND = 100004
    COMMON_INTERNAL_ERROR = 100005
    COMMON_TOO_MANY_REQUESTS = 100006

    # 用户 (20xxxx)
    USER_NOT_FOUND = 200001
    USER_EXISTS = 200002
    USER_PASSWORD_ERROR = 200003
    USER_DISABLED = 200004

    # 帖子 (30xxxx)
    POST_NOT_FOUND = 300001
    POST_ALREADY_EXISTS = 300002

    # 评论 (40xxxx)
    COMMENT_NOT_FOUND = 400001


class ErrorDetail(BaseModel):
    field: Optional[str] = Field(default=None, description="关联字段, 若为通用错误可为空")
    message: str = Field(description="该字段或错误项的描述信息")

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = Field(description="是否成功")
    code: int = Field(description="业务错误码, 0 表示成功")
    message: str = Field(description="人类可读描述")
    data: Optional[T] = Field(default=None, description="成功时返回数据, 失败为 null")
    errors: Optional[List[ErrorDetail]] = Field(default=None, description="错误细节列表")
    extra: Optional[dict[str, Any]] = Field(default=None, description="额外扩展字段")

    @classmethod
    def build_success(
        cls,
        data: Optional[T] = None,
        message: str = "OK",
        *,
        code: ErrorCode = ErrorCode.SUCCESS,
        extra: Optional[dict[str, Any]] = None,
    ) -> "ApiResponse[T]":
        return cls(
            success=True,
            code=int(code),
            message=message,
            data=data,
            extra=extra,
        )

    @classmethod
    def build_fail(
        cls,
        code: ErrorCode,
        message: str,
        *,
        errors: Optional[List[ErrorDetail]] = None,
        data: Optional[Any] = None,
        extra: Optional[dict[str, Any]] = None,
    ) -> "ApiResponse[Any]":
        if code == ErrorCode.SUCCESS:
            raise ValueError("失败响应不能使用 SUCCESS(0) 错误码")
        return cls(
            success=False,
            code=int(code),
            message=message,
            data=data,
            errors=errors,
            extra=extra,
        )


# 便捷函数
def success_response(
    data: Optional[T] = None,
    message: str = "OK",
    *,
    code: ErrorCode = ErrorCode.SUCCESS,
    extra: Optional[dict[str, Any]] = None,
) -> ApiResponse[T]:
    return ApiResponse.build_success(data=data, message=message, code=code, extra=extra)


def fail_response(
    code: ErrorCode,
    message: str,
    *,
    errors: Optional[List[ErrorDetail]] = None,
    data: Optional[Any] = None,
    extra: Optional[dict[str, Any]] = None,
) -> ApiResponse[Any]:
    return ApiResponse.build_fail(
        code=code, message=message, errors=errors, data=data, extra=extra
    )
