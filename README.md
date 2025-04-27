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
```

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

## 输出参数