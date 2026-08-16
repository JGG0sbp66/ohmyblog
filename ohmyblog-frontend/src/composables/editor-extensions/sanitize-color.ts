// src/composables/editor-extensions/sanitize-color.ts
//
// 编辑器颜色属性的白名单消毒。
//
// 为什么需要：Highlight（data-color）、CellBackground（data-bg-color）、
// TextStyle（原始 style 属性按字符串切分）的颜色都取自 HTML 属性 —— 那是
// **原始文本**，粘贴进来的内容可以携带任意值；而 renderHTML 端是字符串拼接
// （style: `background-color: ${v}`）。中间不设卡的话，
// data-color="red;background-image:url(//evil.com/track)" 会原样落库、在
// 读者端和 RSS 里以合法 CSS 声明执行 —— 追踪像素泄漏读者 IP、视觉欺骗。
// DOMPurify 只管 HTML 结构不管 CSS 声明，这道闸必须自己设（脚本注入已由
// Link 扩展的三重校验拦死，这里是同一张网剩下的属性面）。
//
// 白名单 = hex / rgb() 系列 / hsl() 系列 / CSS 命名色。三条规则共同保证一个
// 性质：通过的字符串里不可能出现 ; ( ) " ' 以及 u、r、l 之外的字母组合 ——
// 拼进 style 后逃不出这一条声明，更构造不出 url(...)。

/** #RGB / #RGBA / #RRGGBB / #RRGGBBAA */
const HEX_RE = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;

/**
 * rgb() / rgba() / hsl() / hsla()。括号内只允许数字、点、逗号、空格、
 * 百分号、斜杠、连字符和 deg 单位的字母（hsl 色相用）—— 逗号与空格两种
 * 参数写法都覆盖；字符集里没有 u、r、l、引号、分号和括号，构造不出
 * url(...) 也逃不出这条声明
 */
const FUNC_RE = /^(?:rgba?|hsla?)\(\s*[\d.\s,%/deg-]*\)$/i;

/** CSS 命名色全集（147 个）+ transparent / currentcolor 关键字 */
const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black " +
    "blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse " +
    "chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
    "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta " +
    "darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite " +
    "forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green " +
    "greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender " +
    "lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink " +
    "lightsalmon lightseagreen lightskyblue lightslategray lightslategrey " +
    "lightsteelblue lightyellow lime limegreen linen magenta maroon " +
    "mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace " +
    "olive olivedrab orange orangered orchid palegoldenrod palegreen " +
    "paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown " +
    "salmon sandybrown seagreen seashell sienna silver skyblue slateblue " +
    "slategray slategrey snow springgreen steelblue tan teal thistle tomato " +
    "transparent turquoise violet wheat white whitesmoke yellow yellowgreen " +
    "currentcolor"
  ).split(" "),
);

/**
 * 颜色值过白名单：合法原样返回（统一小写，CSS 对颜色大小写不敏感），
 * 非法返回 null —— 调用方拿 null 就当「没这个属性」处理，整条声明不会
 * 进入文档与 contentHtml。
 */
export const sanitizeColorValue = (
  raw: string | null | undefined,
): string | null => {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (HEX_RE.test(v)) return v;
  if (FUNC_RE.test(v)) return v;
  if (NAMED_COLORS.has(v)) return v;
  return null;
};
