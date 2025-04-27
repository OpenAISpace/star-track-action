# GitHub Star Stats Action

这个GitHub Action可以为您的README文件自动生成一个统计卡片，展示您的GitHub贡献数据，包括：

- 星标数量
- 提交数量
- 议题数量
- 拉取请求数量
- 仓库数量

## 示例

<!-- BEGIN_GITHUB_STATS -->
<div align="center">

## GitHub Stats

<table>
  <tr>
    <td align="center" colspan="4">
      <img alt="GitHub评级" src="https://img.shields.io/badge/Grade-S+-FB2?style=for-the-badge&logo=github&logoColor=white" />
      <img alt="GitHub分数" src="https://img.shields.io/badge/Score-1691-FB2?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="用户" src="https://img.shields.io/badge/User-liyown-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="关注者" src="https://img.shields.io/badge/Followers-16-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="活跃时间" src="https://img.shields.io/badge/Years_Active-4.2-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="贡献仓库" src="https://img.shields.io/badge/Contributed_To-21-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="仓库数量" src="https://img.shields.io/badge/Repositories-48-26A641?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="获得的星标数" src="https://img.shields.io/badge/Stars-1628-FFD94C?style=for-the-badge&logo=github&logoColor=black" />
    </td>
    <td align="center">
      <img alt="Fork数" src="https://img.shields.io/badge/Forked-227-26A641?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="被Watch数" src="https://img.shields.io/badge/Watched-1628-26A641?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="提交数量" src="https://img.shields.io/badge/Commits-675-2188FF?style=for-the-badge&logo=git&logoColor=white" />
    </td>
    <td align="center">
      <img alt="议题数量" src="https://img.shields.io/badge/Issues-16-F74D53?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="拉取请求数量" src="https://img.shields.io/badge/Pull_Requests-1-A371F7?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="主要语言" src="https://img.shields.io/badge/Top_Language-Python-2188FF?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="每仓库提交" src="https://img.shields.io/badge/Commits_Per_Repo-14-2188FF?style=for-the-badge&logo=git&logoColor=white" />
    </td>
    <td align="center">
      <img alt="每仓库星标" src="https://img.shields.io/badge/Stars_Per_Repo-33.9-FFD94C?style=for-the-badge&logo=github&logoColor=black" />
    </td>
    <td align="center">
      <img alt="Issue关闭率" src="https://img.shields.io/badge/Issue_Close_Rate-50%-F74D53?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="PR合并率" src="https://img.shields.io/badge/PR_Merge_Rate-100%-A371F7?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
</table>

<sup>📅 统计更新于: 2025/04/27</sup>

</div>
<!-- END_GITHUB_STATS -->

## 使用方法

### 基本使用

创建一个工作流文件 `.github/workflows/github-stats.yml`：

```yaml
name: Update GitHub Stats

on:
  schedule:
    - cron: '0 0 * * *'  # 每天运行一次
  workflow_dispatch:     # 允许手动触发

jobs:
  update-stats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Update GitHub Stats
        uses: your-username/star-track-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          username: ${{ github.repository_owner }}
          
      # 注意：不再需要手动提交步骤，Action 会自动提交更改

### 高级配置

```yaml
- name: Update GitHub Stats
  uses: your-username/star-track-action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}  # 需要有提交权限的token
    username: your-username
    scope: all             # 'personal' 或 'all'（包括组织），默认为 'personal'
    readme_path: README.md # README文件路径，默认为 'README.md'
    card_title: 我的GitHub统计  # 卡片标题，默认为 'GitHub Stats'
    concurrency: 3         # 并发处理的仓库数量，默认为5，范围1-10
```

### 关于性能优化

此Action使用并发处理来加速统计过程，特别适用于拥有大量仓库的用户：

1. 默认情况下，Action会同时处理5个仓库的数据
2. 您可以通过`concurrency`参数调整并发数（1-10）
3. 较高的并发数会加快处理速度，但可能触发GitHub API速率限制
4. 对于拥有少量仓库的用户，建议使用默认值
5. 对于拥有大量仓库（50+）的用户，可以考虑降低并发数至3，以避免API限制

### 关于自动提交

此Action包含自动提交功能，会自动将更新后的统计卡片提交到您的仓库。请注意：

1. 您需要提供有写入权限的GitHub令牌。使用默认的`GITHUB_TOKEN`时，您可能需要在仓库设置中授予"写入权限"。
2. 如果您希望在受保护的分支上提交，请调整分支保护规则以允许GitHub Actions提交。
3. 每次统计数据更新时，Action会自动创建一次提交。

如果自动提交失败，您可以查看Action日志获取错误信息，也可以添加手动提交步骤作为备选方案。

## 输入参数

| 参数名 | 描述 | 必填 | 默认值 |
|--------|------|------|--------|
| `github_token` | GitHub token，用于访问API | 是 | - |
| `username` | GitHub用户名 | 是 | - |
| `scope` | 统计范围：'personal'表示个人仓库，'all'表示包括组织在内的所有仓库 | 否 | `personal` |
| `readme_path` | README文件路径 | 否 | `README.md` |
| `card_title` | 统计卡片的标题 | 否 | `GitHub Stats` |
| `concurrency` | 并发处理的仓库数量 | 否 | `5` |

## 输出参数

| 参数名 | 描述 |
|--------|------|
| `stars_count` | 获得的星标总数 |
| `commits_count` | 提交总数 |
| `issues_count` | 创建的议题总数 |
| `prs_count` | 创建的拉取请求总数 |
| `repositories_count` | 仓库总数 |
| `followers_count` | 关注者数量 |
| `following_count` | 关注的用户数量 |
| `contributed_to_count` | 贡献的仓库数量 |
| `top_language` | 最常用的编程语言 |
| `days_active` | 活跃天数 |
| `developer_grade` | 开发者等级（D-到SSS） |
| `developer_score` | 开发者分数 |
| `issue_close_rate` | Issue关闭率（百分比） |
| `pr_merge_rate` | PR合并率（百分比） |
| `execution_time` | 执行时间（秒） |

## 注意事项

1. 此Action需要访问GitHub API，对于大型仓库或很多仓库的用户，可能会触发API速率限制。
2. 对于私有仓库的统计，您可能需要使用具有更高权限的Personal Access Token。
3. 如果您想在组织中使用此Action，确保令牌有足够的权限访问组织仓库。

## 许可证

MIT
