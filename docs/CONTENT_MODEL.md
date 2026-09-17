# 内容结构与发布规则

## 日刊数据

每期字段：id、date（YYYY-MM-DD）、timezone、status（demo/draft/published）、trends（固定 3 条）、skill、useCase。

趋势字段：id、title、summary、whyItMatters、sourceUrl、sourcePublishedAt、verifiedAt。

技能字段：id、title、minutes、toolRequirements、steps、prompt、successCriteria。

用途字段：id、title、scenario、inputExample、outputExample、limitations、evidenceUrl、verifiedAt。

趋势来源和用途依据在 demo 状态下可为空，但必须显示示例标签。published 状态下来源、来源日期、核查时间及案例依据不能为空；禁止将演示用途称为真实案例。

## 发布检查

1. 核对原始来源，日期使用明确时区，分开记录事件日期与文章发布时间。
2. 用自己的语言概括，外链原文；不复制受版权保护的全文。
3. 复现技能步骤，确认工具的账号、费用与地区限制，并注明核查时间。
4. 案例输入输出去除个人和敏感信息；假设例子明确写成演示。
5. 编辑审核后才能从 draft 变为 published；缺少来源不能发布。
6. 更新保留日期与更正说明；首页展示内容实际日期。

content/demo.json 仅用于测试界面和数据结构，不构成真实资讯或经过核验的案例。
