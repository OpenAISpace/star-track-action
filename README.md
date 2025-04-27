# Star Track Action

[![GitHub release](https://img.shields.io/github/v/release/OpenAISpace/star-track-action?style=flat-square)](https://github.com/OpenAISpace/star-track-action/releases)

这个GitHub Action可以为您的README文件自动生成一个精美的GitHub统计卡片，全面展示您的开源贡献和活动数据，包括：

- ⭐ 获得的星标数量
- 📊 仓库及贡献数据
- 📝 提交数量和频率
- 🔄 PR和Issue的详细统计
- 🏆 基于贡献的开发者评级系统 (D- 到 SSS)
- 📈 关注者、活跃时间等更多数据

## 统计卡片示例

<!-- BEGIN_GITHUB_STATS -->
<div align="center">

## GitHub Stats

<table>
  <tr>
    <td align="center" colspan="4">
      <img alt="GitHub评级" src="https://img.shields.io/badge/Grade-S+-FB2?style=for-the-badge&logo=github&logoColor=white" />
      <img alt="GitHub分数" src="https://img.shields.io/badge/Score-1692-FB2?style=for-the-badge&logo=github&logoColor=white" />
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
      <img alt="提交数量" src="https://img.shields.io/badge/Commits-658-2188FF?style=for-the-badge&logo=git&logoColor=white" />
    </td>
    <td align="center">
      <img alt="议题数量" src="https://img.shields.io/badge/Issues-44-F74D53?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="拉取请求数量" src="https://img.shields.io/badge/Pull_Requests-9-A371F7?style=for-the-badge&logo=github&logoColor=white" />
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
      <img alt="Issue关闭率" src="https://img.shields.io/badge/Issue_Close_Rate-73%25-F74D53?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="PR合并率" src="https://img.shields.io/badge/PR_Merge_Rate-89%25-A371F7?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
</table>

<sup>📅 统计更新于: 2025/04/27</sup>

</div>
<!-- END_GITHUB_STATS -->

## ✨ 特性

- 🔄 **自动更新**：定期或手动触发时自动更新您的GitHub统计数据
- 🎨 **精美设计**：基于shields.io的美观统计卡片，自动适应不同主题
- 📊 **全面统计**：包括星标、提交、PR、Issue、仓库等多维度数据
- 🌟 **评级系统**：根据贡献计算开发者评级（D-到SSS）
- 📈 **详细指标**：活跃时间、贡献仓库、关注者等更多数据
- 🔒 **安全可靠**：优化的API请求处理，避免触发GitHub限制
- 🤖 **自动提交**：无需额外步骤，自动将更新后的统计提交到仓库

## 🚀 开始使用

### 基本配置

1. 在您的仓库中创建工作流文件 `.github/workflows/github-stats.yml`：

```yaml
name: Update GitHub Stats

on:
  schedule:
    - cron: '0 0 * * *'  # 每天运行一次
  workflow_dispatch:     # 允许手动触发

jobs:
  update-stats:
    runs-on: ubuntu-latest
    permissions:
      contents: write    # 需要写入权限以提交更改
    steps:
      - uses: actions/checkout@v4
      
      - name: Update GitHub Stats
        uses: OpenAISpace/star-track-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          username: ${{ github.repository_owner }}
```

2. 确保您的仓库中有一个README.md文件（默认情况下，统计卡片会添加到这个文件）

3. 运行工作流（可以通过"Actions"选项卡手动触发）

4. 工作流运行后，您的README.md将自动更新，包含一个精美的GitHub统计卡片

### 高级配置

```yaml
- name: Update GitHub Stats
  uses: OpenAISpace/star-track-action@v1
  with:
    # 必需参数
    github_token: ${{ secrets.GITHUB_TOKEN }}  # 需要有提交权限的token
    username: your-username                     # 要统计的GitHub用户名
    
    # 可选参数
    scope: all             # 'personal'(仅个人仓库)或'all'(包括组织)，默认为'personal'
    readme_path: README.md # README文件路径，默认为'README.md'
    card_title: 我的GitHub统计  # 卡片标题，默认为'GitHub Stats'
```

## 🔧 配置参数

### 输入参数

| 参数名 | 描述 | 必填 | 默认值 |
|--------|------|------|--------|
| `github_token` | GitHub token，用于访问API | 是 | - |
| `username` | 要统计的GitHub用户名 | 是 | - |
| `scope` | 统计范围：'personal'表示个人仓库，'all'表示包括组织在内的所有仓库 | 否 | `personal` |
| `readme_path` | README文件路径 | 否 | `README.md` |
| `card_title` | 统计卡片的标题 | 否 | `GitHub Stats` |

### 输出参数

| 参数名 | 描述 |
|--------|------|
| `stars_count` | 获得的星标总数 |
| `commits_count` | 提交总数 |
| `issues_count` | 仓库中的议题总数 |
| `prs_count` | 仓库中的拉取请求总数 |
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

## 💡 提示与说明

### 工作流权限

确保您的工作流具有写入仓库内容的权限。在工作流文件中添加：

```yaml
permissions:
  contents: write
```

或在仓库设置的"Actions"部分中，为工作流设置适当的权限。

### 关于统计数据

- **仓库统计**：统计包括用户拥有的所有公开仓库
- **提交统计**：仅计算用户本人的提交数量
- **Issue和PR统计**：统计仓库中所有的Issue和PR数量，不限于用户创建的
- **活跃时间**：根据最早创建的仓库日期计算
- **评分系统**：基于各项统计指标的加权计算，包括星标、提交、活跃度等

### 自定义统计卡片位置

统计卡片将添加到README文件的末尾，或替换已有的统计卡片（由`<!-- BEGIN_GITHUB_STATS -->`和`<!-- END_GITHUB_STATS -->`标记标识）。



## 📄 许可证

该项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

---

<div align="center">
  <sub>由 Liuyaowen❤️ 构建 | Star Track Action - 让您的GitHub统计数据更美观</sub>
</div>
