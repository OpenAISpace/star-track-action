import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * GitHub统计信息的接口
 */
interface GitHubStats {
  stars: number
  commits: number
  issues: number
  pullRequests: number
  repositories: number
  followers: number
  following: number
  contributions: number
  forked: number
  watchedBy: number
  contributedTo: number
  languages: Record<string, number>
  topLanguage: string
  oldestRepo: Date | null
  daysActive: number
  averageCommitsPerRepo: number
  starsPerRepo: number
  issueCloseRate: number
  prMergeRate: number
  grade: string
  score: number
}

/**
 * 评级系统的分数范围
 */
interface GradeRange {
  grade: string
  minScore: number
  color: string
}

/**
 * 评级范围定义，从D-到SSS
 */
const GRADE_RANGES: GradeRange[] = [
  { grade: 'D-', minScore: 0, color: '933' },
  { grade: 'D', minScore: 5, color: '933' },
  { grade: 'D+', minScore: 10, color: '933' },
  { grade: 'C-', minScore: 20, color: '999' },
  { grade: 'C', minScore: 30, color: '999' },
  { grade: 'C+', minScore: 40, color: '999' },
  { grade: 'B-', minScore: 60, color: '669' },
  { grade: 'B', minScore: 80, color: '669' },
  { grade: 'B+', minScore: 100, color: '669' },
  { grade: 'A-', minScore: 150, color: '396' },
  { grade: 'A', minScore: 200, color: '396' },
  { grade: 'A+', minScore: 300, color: '396' },
  { grade: 'S-', minScore: 500, color: 'FB2' },
  { grade: 'S', minScore: 800, color: 'FB2' },
  { grade: 'S+', minScore: 1200, color: 'FB2' },
  { grade: 'SS', minScore: 2000, color: 'F84' },
  { grade: 'SS+', minScore: 3500, color: 'F84' },
  { grade: 'SSS', minScore: 5000, color: 'F42' }
]

/**
 * Action的主函数
 */
export async function run(): Promise<void> {
  const startTime = Date.now();
  
  try {
    // 获取输入参数
    const token = core.getInput('github_token', { required: true })
    const username = core.getInput('username', { required: true })
    const scope = core.getInput('scope')
    const readmePath = core.getInput('readme_path')
    const cardTitle = core.getInput('card_title')
    
    core.info(`处理用户 ${username} 的统计信息...`)
    core.info(`统计范围: ${scope}`)

    // 创建GitHub API客户端，包含所有必要功能
    const octokit = new Octokit({
      auth: token,
      previews: ['jean-grey-preview', 'mercy-preview']
    })
    
    try {
      // 验证用户是否存在
      await octokit.users.getByUsername({
        username
      });
      
      // 获取统计信息
      const stats = await getGitHubStats(octokit, username, scope === 'all')
      
      // 设置基本输出
      core.setOutput('stars_count', stats.stars)
      core.setOutput('commits_count', stats.commits)
      core.setOutput('issues_count', stats.issues)
      core.setOutput('prs_count', stats.pullRequests)
      
      // 设置新增输出
      core.setOutput('repositories_count', stats.repositories)
      core.setOutput('followers_count', stats.followers)
      core.setOutput('following_count', stats.following)
      core.setOutput('contributed_to_count', stats.contributedTo)
      core.setOutput('top_language', stats.topLanguage || 'None')
      core.setOutput('days_active', stats.daysActive)
      core.setOutput('developer_grade', stats.grade)
      core.setOutput('developer_score', stats.score)
      core.setOutput('issue_close_rate', Math.round(stats.issueCloseRate))
      core.setOutput('pr_merge_rate', Math.round(stats.prMergeRate))
      
      // 计算执行时间（秒）
      const executionTime = Math.round((Date.now() - startTime) / 1000);
      core.setOutput('execution_time', executionTime);
      
      // 生成统计卡片
      const card = generateStatsCard(stats, username, cardTitle)
      
      // 更新README文件
      const hasChanges = await updateReadme(readmePath, card)
      
      // 自动提交更改
      if (hasChanges) {
        await commitAndPushChanges(readmePath, stats)
        core.info(`成功创建GitHub统计卡片并提交更改! 用户等级: ${stats.grade}, 分数: ${stats.score}, 耗时: ${executionTime}秒`)
      } else {
        core.info(`成功创建GitHub统计卡片! 用户等级: ${stats.grade}, 分数: ${stats.score}, 耗时: ${executionTime}秒 (无变更需要提交)`)
      }
    } catch (apiError) {
      core.error(`GitHub API错误: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
      core.setFailed(`无法获取用户 ${username} 的数据，请确认用户名是否正确且token有效`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

/**
 * 获取GitHub统计信息
 */
async function getGitHubStats(
  octokit: Octokit, 
  username: string, 
  includeOrgs: boolean
): Promise<GitHubStats> {
  const stats: GitHubStats = {
    stars: 0,
    commits: 0,
    issues: 0,
    pullRequests: 0,
    repositories: 0,
    followers: 0,
    following: 0,
    contributions: 0,
    forked: 0,
    watchedBy: 0,
    contributedTo: 0,
    languages: {},
    topLanguage: '',
    oldestRepo: null,
    daysActive: 0,
    averageCommitsPerRepo: 0,
    starsPerRepo: 0,
    issueCloseRate: 0,
    prMergeRate: 0,
    grade: 'D-', // 设置默认评级
    score: 0
  }

  try {
    core.info(`开始获取用户 ${username} 的GitHub统计数据...`)
    
    // 获取用户基本信息
    await fetchUserInfo(octokit, username, stats)
    
    // 获取用户的仓库列表
    const repos = await fetchAllRepositories(octokit, username, includeOrgs)
    stats.repositories = repos.length
    
    if (repos.length === 0) {
      core.warning(`未找到用户 ${username} 的任何仓库，请检查用户名是否正确且访问令牌权限是否足够`)
      return await calculateRating(stats)
    }
    
    core.info(`找到 ${repos.length} 个仓库，开始统计数据...`)
    
    // 收集语言数据，用于计算最常用的语言
    const languageCounts: Record<string, number> = {}
    
    // 跟踪关闭的issue和合并的PR数量，用于计算比率
    let closedIssues = 0
    let totalIssues = 0
    let mergedPRs = 0
    let totalPRs = 0
    
    // 跟踪最早的仓库创建日期
    let oldestRepoDate: Date | null = null
    
    // 顺序处理每个仓库
    let processedCount = 0
    
    for (const repo of repos) {
      try {
        // 处理单个仓库
        const repoResult = {
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          language: repo.language,
          createdAt: new Date(repo.created_at),
          commits: 0,
          issues: 0,
          closedIssues: 0,
          prs: 0,
          mergedPRs: 0,
          fullName: `${repo.owner.login}/${repo.name}`
        }
        
        // 获取各种统计数据
        repoResult.commits = await fetchCommitCount(octokit, username, repo.owner.login, repo.name)
        
        // 添加短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        
        repoResult.issues = await fetchIssueCount(octokit, username, repo.owner.login, repo.name)
        
        // 添加短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        
        repoResult.closedIssues = await fetchClosedIssueCount(octokit, username, repo.owner.login, repo.name)
        
        // 添加短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        
        repoResult.prs = await fetchPRCount(octokit, username, repo.owner.login, repo.name)
        
        // 添加短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        
        repoResult.mergedPRs = await fetchMergedPRCount(octokit, username, repo.owner.login, repo.name)
        
        // 增加处理计数
        processedCount++
        
        // 累加统计数据
        stats.stars += repoResult.stars
        stats.forked += repoResult.forks
        stats.watchedBy += repoResult.watchers
        
        // 更新最早的仓库日期
        if (!oldestRepoDate || repoResult.createdAt < oldestRepoDate) {
          oldestRepoDate = repoResult.createdAt
        }
        
        // 统计语言
        if (repoResult.language) {
          if (!languageCounts[repoResult.language]) {
            languageCounts[repoResult.language] = 0
          }
          languageCounts[repoResult.language]++
        }
        
        // 累加其他统计数据
        stats.commits += repoResult.commits
        stats.issues += repoResult.issues
        stats.pullRequests += repoResult.prs
        closedIssues += repoResult.closedIssues
        totalIssues += repoResult.issues
        mergedPRs += repoResult.mergedPRs
        totalPRs += repoResult.prs
        
        core.debug(`仓库 ${repoResult.fullName} 统计结果: stars=${repoResult.stars}, commits=${repoResult.commits}, issues=${repoResult.issues}/${repoResult.closedIssues}, prs=${repoResult.prs}/${repoResult.mergedPRs}`)
        
        // 每处理10个仓库输出一次进度
        if (processedCount % 10 === 0 || processedCount === repos.length) {
          core.info(`已处理 ${processedCount}/${repos.length} 个仓库...`)
        }
      } catch (repoError) {
        core.warning(`处理仓库 ${repo.owner.login}/${repo.name} 时出错: ${repoError instanceof Error ? repoError.message : String(repoError)}`)
        processedCount++
      }
    }
    
    // 设置语言统计
    stats.languages = languageCounts
    
    // 找出最常用的语言
    let maxCount = 0
    for (const [language, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        maxCount = count
        stats.topLanguage = language
      }
    }
    
    // 设置最早的仓库创建日期
    stats.oldestRepo = oldestRepoDate
    
    // 计算活跃天数
    if (oldestRepoDate) {
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - oldestRepoDate.getTime())
      stats.daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    
    // 计算平均每个仓库的提交数
    stats.averageCommitsPerRepo = stats.repositories > 0 ? stats.commits / stats.repositories : 0
    
    // 计算平均每个仓库的星标数
    stats.starsPerRepo = stats.repositories > 0 ? stats.stars / stats.repositories : 0
    
    // 计算issue关闭率
    stats.issueCloseRate = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0
    
    // 计算PR合并率
    stats.prMergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0
    
    // 计算评级
    return await calculateRating(stats)
  } catch (error) {
    core.error(`获取GitHub统计信息出错: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * 获取用户的基本信息
 */
async function fetchUserInfo(
  octokit: Octokit, 
  username: string, 
  stats: GitHubStats
): Promise<void> {
  try {
    // 获取用户信息
    const { data: user } = await octokit.users.getByUsername({
      username
    })
    
    stats.followers = user.followers || 0
    stats.following = user.following || 0
    
    // 尝试获取贡献的仓库数量
    try {
      // 使用GraphQL API获取用户贡献的仓库数量
      const query = `
        query($username: String!) {
          user(login: $username) {
            repositoriesContributedTo(first: 1) {
              totalCount
            }
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
              contributionYears
            }
          }
        }
      `
      
      const { user: userData } = await octokit.graphql(query, {
        username
      }) as any
      
      if (userData) {
        // 获取贡献的仓库数量
        stats.contributedTo = userData.repositoriesContributedTo?.totalCount || 0
        
        // 获取贡献总数
        if (userData.contributionsCollection?.contributionCalendar) {
          stats.contributions = userData.contributionsCollection.contributionCalendar.totalContributions || 0
        } else {
          // 如果无法直接获取，则估算贡献总数
          const contributionYears = userData.contributionsCollection?.contributionYears || []
          stats.contributions = contributionYears.length * 365 * 0.5 // 假设每年平均50%的天数有贡献
        }
      }
    } catch (graphqlError) {
      core.debug(`获取用户贡献信息出错: ${graphqlError instanceof Error ? graphqlError.message : String(graphqlError)}`)
      
      // 如果GraphQL查询失败，尝试使用REST API获取一些基本信息
      try {
        // 贡献的仓库数量可以从用户个人资料中获取，但需要模拟浏览器请求
        stats.contributedTo = Math.round(stats.repositories * 0.7) // 粗略估计：贡献仓库约为自己仓库的70%
        stats.contributions = Math.round(stats.commits * 1.2) // 粗略估计：贡献比提交数稍多
      } catch (restError) {
        core.debug(`使用REST API获取用户贡献信息出错: ${restError instanceof Error ? restError.message : String(restError)}`)
        stats.contributedTo = 0
        stats.contributions = 0
      }
    }
    
    core.debug(`获取到用户基本信息: 关注者=${stats.followers}, 关注=${stats.following}, 贡献仓库=${stats.contributedTo}, 贡献数=${stats.contributions}`)
  } catch (error) {
    core.warning(`获取用户基本信息出错: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 获取仓库中关闭的issue数量（所有关闭的issue，不限于用户创建的）
 */
async function fetchClosedIssueCount(
  octokit: Octokit, 
  username: string, 
  owner: string, 
  repo: string
): Promise<number> {
  try {
    // 直接使用REST API，获取所有关闭的issue
    let count = 0;
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      try {
        const { data } = await octokit.issues.listForRepo({
          owner,
          repo,
          state: 'closed',
          per_page: 100,
          page
        });
        
        // 过滤掉PR，只计算真正的issue
        const actualIssues = data.filter(issue => !issue.pull_request);
        count += actualIssues.length;
        
        core.debug(`[REST] 仓库 ${owner}/${repo} 关闭的Issue页面${page}: 找到${data.length}个条目，其中${actualIssues.length}个是实际关闭的Issue，累计${count}个`);
        
        if (data.length < 100) {
          hasMorePages = false;
        } else {
          page++;
          // 添加短暂延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (pageError) {
        core.debug(`获取关闭的Issue分页${page}出错: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
        hasMorePages = false;
      }
    }
    
    return count;
  } catch (error) {
    core.debug(`获取仓库 ${owner}/${repo} 的关闭Issue数量出错: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

/**
 * 获取仓库中合并的PR数量（所有合并的PR，不限于用户创建的）
 */
async function fetchMergedPRCount(
  octokit: Octokit, 
  username: string, 
  owner: string, 
  repo: string
): Promise<number> {
  try {
    // 直接使用REST API获取所有合并的PR
    let count = 0;
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      try {
        const { data } = await octokit.pulls.list({
          owner,
          repo,
          state: 'closed',
          per_page: 100,
          page
        });
        
        // 检查每个PR的合并状态
        for (const pr of data) {
          if (pr.merged_at) {
            count++;
          }
        }
        
        core.debug(`[REST] 仓库 ${owner}/${repo} 已关闭PR页面${page}: 找到${data.length}个PR，其中${count}个已合并`);
        
        if (data.length < 100) {
          hasMorePages = false;
        } else {
          page++;
          // 添加短暂延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (pageError) {
        core.debug(`获取已合并PR分页${page}出错: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
        hasMorePages = false;
      }
    }
    
    return count;
  } catch (error) {
    core.debug(`获取仓库 ${owner}/${repo} 的合并PR数量出错: ${error instanceof Error ? error.message : String(error)}`);
    // 如果所有尝试都失败，可以尝试估算
    try {
      // 获取仓库的PR总数
      const prCount = await fetchPRCount(octokit, username, owner, repo);
      // 估算70%的PR被合并
      return Math.round(prCount * 0.7);
    } catch (estimateError) {
      return 0;
    }
  }
}

/**
 * 计算用户评级
 */
async function calculateRating(stats: GitHubStats): Promise<GitHubStats> {
  // 计算总分
  let score = 0
  
  // 基于贡献的分数 - 更加严格的权重
  score += stats.repositories * 1           // 每个仓库1分（降低）
  score += stats.stars * 0.5                // 每个星标0.5分（降低）
  score += Math.min(stats.commits * 0.1, 300)   // 每个提交0.1分，最多300分（降低且设上限）
  
  // 由于PR和Issue现在统计的是仓库中所有的，而不仅是用户创建的，所以降低权重
  score += Math.min(stats.issues * 0.05, 50)    // 每个issue仅0.05分，最多50分
  score += Math.min(stats.pullRequests * 0.1, 50)   // 每个PR仅0.1分，最多50分
  
  score += stats.followers * 0.3            // 每个关注者0.3分（降低）
  score += stats.contributedTo * 2          // 每个贡献仓库2分（降低）
  score += stats.forked * 0.2               // 每个被fork0.2分（降低）
  
  // 特殊奖励指标 - 高星项目
  let highStarRepoBonus = 0
  if (stats.starsPerRepo >= 100) highStarRepoBonus += 200
  else if (stats.starsPerRepo >= 50) highStarRepoBonus += 100
  else if (stats.starsPerRepo >= 20) highStarRepoBonus += 50
  else if (stats.starsPerRepo >= 10) highStarRepoBonus += 20
  score += highStarRepoBonus
  
  // 高星项目奖励（总星标数）
  if (stats.stars >= 10000) score += 2000    // 10k星以上项目，SSS级别加分
  else if (stats.stars >= 5000) score += 1000 // 5k星以上项目，SS级别加分
  else if (stats.stars >= 1000) score += 500 // 1k星以上项目，S级别加分
  else if (stats.stars >= 500) score += 200  // 500星以上项目，A+级别加分
  else if (stats.stars >= 100) score += 50   // 100星以上项目加分
  
  // 基于比率的加分 - 降低权重
  score += Math.min(stats.averageCommitsPerRepo, 50) * 1  // 平均每仓库提交数，最多50分
  score += Math.min(stats.starsPerRepo * 2, 100)          // 平均每仓库星标数，最多100分
  
  // 由于现在统计的是仓库中所有的PR和Issue，关闭率和合并率更有意义
  score += Math.min((stats.issueCloseRate / 10), 10)      // issue关闭率除以10，最多10分
  score += Math.min((stats.prMergeRate / 10), 10)         // PR合并率除以10，最多10分
  
  // 活跃时间加分 - 降低
  if (stats.daysActive > 0) {
    const yearsActive = stats.daysActive / 365
    score += Math.min(yearsActive * 5, 25)   // 每年5分，最多25分（降低）
  }
  
  // 四舍五入到整数
  score = Math.round(score)
  stats.score = score
  
  // 根据分数确定等级
  for (let i = GRADE_RANGES.length - 1; i >= 0; i--) {
    if (score >= GRADE_RANGES[i].minScore) {
      stats.grade = GRADE_RANGES[i].grade
      break
    }
  }
  
  // 确保评级始终有默认值
  if (!stats.grade) {
    stats.grade = GRADE_RANGES[0].grade; // 使用最低级别的评级
  }
  
  core.info(`评分计算完成: ${score}分，等级: ${stats.grade}`)
  
  return stats
}

/**
 * 获取用户所有的仓库
 */
async function fetchAllRepositories(
  octokit: Octokit, 
  username: string, 
  includeOrgs: boolean
): Promise<any[]> {
  let repos: any[] = []
  
  try {
    // 确保用户名不包含非ASCII字符
    const sanitizedUsername = encodeURIComponent(username).replace(/%/g, '')
    
    // 获取用户的个人仓库
    const userRepos = await octokit.paginate(octokit.repos.listForUser, {
      username: sanitizedUsername,
      per_page: 100,
      type: 'owner'
    })
    repos = repos.concat(userRepos)
    
    // 如果需要包含组织，则获取用户所属组织的仓库
    if (includeOrgs) {
      // 获取用户所属的组织
      const orgs = await octokit.paginate(octokit.orgs.listForUser, {
        username: sanitizedUsername,
        per_page: 100
      })
      
      // 获取每个组织的仓库
      for (const org of orgs) {
        const orgRepos = await octokit.paginate(octokit.repos.listForOrg, {
          org: org.login,
          per_page: 100
        })
        repos = repos.concat(orgRepos)
      }
    }
    
    return repos;
  } catch (error) {
    core.error(`获取仓库列表出错: ${error instanceof Error ? error.message : String(error)}`)
    // 返回空数组而不是抛出异常，以便继续执行
    return [];
  }
}

/**
 * 获取用户在特定仓库的提交数量
 */
async function fetchCommitCount(
  octokit: Octokit, 
  username: string, 
  owner: string, 
  repo: string
): Promise<number> {
  try {
    // 尝试使用搜索API获取提交计数（最可靠的方法）
    try {
      const { data } = await octokit.search.commits({
        q: `repo:${owner}/${repo} author:${username}`,
        per_page: 1
      });
      
      core.debug(`[Search] 仓库 ${owner}/${repo} 获取提交数量: ${data.total_count}`);
      return data.total_count;
    } catch (searchError) {
      // 如果是访问受限错误(403)，直接跳到REST API
      const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
      core.debug(`搜索API获取提交数量失败: ${errorMessage}`);
      
      // 如果搜索API失败，回退到REST API分页获取
      try {
        return await countCommitsWithREST(octokit, username, owner, repo);
      } catch (restError) {
        core.debug(`REST API获取提交数量失败: ${restError instanceof Error ? restError.message : String(restError)}`);
        
        // 最后回退方案：尝试获取单个提交，如果有则返回1，否则返回0
        try {
          const response = await octokit.repos.listCommits({
            owner,
            repo,
            author: username,
            per_page: 1
          });
          
          return response.data.length > 0 ? 1 : 0;
        } catch (finalError) {
          core.debug(`所有方法获取提交数量失败: ${finalError instanceof Error ? finalError.message : String(finalError)}`);
          return 0;
        }
      }
    }
  } catch (error) {
    core.debug(`获取仓库 ${owner}/${repo} 的提交数量出错: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

/**
 * 使用REST API和分页获取提交数量
 */
async function countCommitsWithREST(
  octokit: Octokit,
  username: string,
  owner: string,
  repo: string
): Promise<number> {
  let count = 0;
  let page = 1;
  let hasMorePages = true;
  const perPage = 100; // 每页获取最大数量，减少API调用
  
  while (hasMorePages) {
    try {
      const response = await octokit.repos.listCommits({
        owner,
        repo,
        author: username,
        per_page: perPage,
        page
      });
      
      count += response.data.length;
      
      // 添加延迟，避免触发API限制
      if (response.data.length === perPage) {
        page++;
        // 在连续请求之间添加短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        hasMorePages = false;
      }
    } catch (error) {
      // 如果分页过程中出错，停止分页并返回当前计数
      core.debug(`分页获取提交数量出错: ${error instanceof Error ? error.message : String(error)}`);
      hasMorePages = false;
    }
  }
  
  core.debug(`[REST] 仓库 ${owner}/${repo} 获取提交数量: ${count}`);
  return count;
}

/**
 * 获取特定仓库中的PR数量（所有PR，不限于用户创建的）
 */
async function fetchPRCount(
  octokit: Octokit, 
  username: string, 
  owner: string, 
  repo: string
): Promise<number> {
  try {
    // 使用REST API获取仓库中所有PR数量
    let count = 0;
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      try {
        const { data } = await octokit.pulls.list({
          owner,
          repo,
          state: 'all',
          per_page: 100,
          page
        });
        
        // 统计所有PR，不限于用户创建的
        count += data.length;
        
        core.debug(`[REST] 仓库 ${owner}/${repo} PR页面${page}: 找到${data.length}个PR，累计${count}个`);
        
        if (data.length < 100) {
          hasMorePages = false;
        } else {
          page++;
          // 添加短暂延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (pageError) {
        core.debug(`获取PR分页${page}出错: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
        hasMorePages = false;
      }
    }
    
    return count;
  } catch (error) {
    core.debug(`获取仓库 ${owner}/${repo} 的PR数量出错: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

/**
 * 获取特定仓库中的Issue数量（所有Issue，不限于用户创建的）
 */
async function fetchIssueCount(
  octokit: Octokit, 
  username: string, 
  owner: string, 
  repo: string
): Promise<number> {
  try {
    // 使用REST API获取仓库中所有Issue数量
    let count = 0;
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      try {
        const { data } = await octokit.issues.listForRepo({
          owner,
          repo,
          state: 'all',
          per_page: 100,
          page
        });
        
        // 过滤掉PR，因为在GitHub API中PR也被视为Issue
        const actualIssues = data.filter(issue => !issue.pull_request);
        count += actualIssues.length;
        
        core.debug(`[REST] 仓库 ${owner}/${repo} Issue页面${page}: 找到${data.length}个条目，其中${actualIssues.length}个是实际Issue，累计${count}个Issue`);
        
        if (data.length < 100) {
          hasMorePages = false;
        } else {
          page++;
          // 添加短暂延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (pageError) {
        core.debug(`获取Issue分页${page}出错: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
        hasMorePages = false;
      }
    }
    
    return count;
  } catch (error) {
    core.debug(`获取仓库 ${owner}/${repo} 的Issue数量出错: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

/**
 * 生成统计卡片的HTML内容
 */
function generateStatsCard(stats: GitHubStats, username: string, cardTitle: string): string {
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // 查找等级的颜色
  let gradeColor = '999'
  for (const range of GRADE_RANGES) {
    if (range.grade === stats.grade) {
      gradeColor = range.color
      break
    }
  }
  
  // 计算活跃年数
  const yearsActive = stats.daysActive > 0 ? (stats.daysActive / 365).toFixed(1) : '0'
  
  // 格式化百分比，移除百分号以避免URL编码问题
  const formatPercent = (value: number) => Math.round(value).toString()
  
  return `<!-- BEGIN_GITHUB_STATS -->
<div align="center">

## ${cardTitle}

<table>
  <tr>
    <td align="center" colspan="4">
      <img alt="GitHub评级" src="https://img.shields.io/badge/Grade-${stats.grade}-${gradeColor}?style=for-the-badge&logo=github&logoColor=white" />
      <img alt="GitHub分数" src="https://img.shields.io/badge/Score-${stats.score}-${gradeColor}?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="用户" src="https://img.shields.io/badge/User-${username}-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="关注者" src="https://img.shields.io/badge/Followers-${stats.followers}-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="活跃时间" src="https://img.shields.io/badge/Years_Active-${yearsActive}-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="贡献仓库" src="https://img.shields.io/badge/Contributed_To-${stats.contributedTo}-2D9EF1?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="仓库数量" src="https://img.shields.io/badge/Repositories-${stats.repositories}-26A641?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="获得的星标数" src="https://img.shields.io/badge/Stars-${stats.stars}-FFD94C?style=for-the-badge&logo=github&logoColor=black" />
    </td>
    <td align="center">
      <img alt="Fork数" src="https://img.shields.io/badge/Forked-${stats.forked}-26A641?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="被Watch数" src="https://img.shields.io/badge/Watched-${stats.watchedBy}-26A641?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="提交数量" src="https://img.shields.io/badge/Commits-${stats.commits}-2188FF?style=for-the-badge&logo=git&logoColor=white" />
    </td>
    <td align="center">
      <img alt="议题数量" src="https://img.shields.io/badge/Issues-${stats.issues}-F74D53?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="拉取请求数量" src="https://img.shields.io/badge/Pull_Requests-${stats.pullRequests}-A371F7?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="主要语言" src="https://img.shields.io/badge/Top_Language-${stats.topLanguage || 'None'}-2188FF?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img alt="每仓库提交" src="https://img.shields.io/badge/Commits_Per_Repo-${Math.round(stats.averageCommitsPerRepo)}-2188FF?style=for-the-badge&logo=git&logoColor=white" />
    </td>
    <td align="center">
      <img alt="每仓库星标" src="https://img.shields.io/badge/Stars_Per_Repo-${stats.starsPerRepo.toFixed(1)}-FFD94C?style=for-the-badge&logo=github&logoColor=black" />
    </td>
    <td align="center">
      <img alt="Issue关闭率" src="https://img.shields.io/badge/Issue_Close_Rate-${formatPercent(stats.issueCloseRate)}%25-F74D53?style=for-the-badge&logo=github&logoColor=white" />
    </td>
    <td align="center">
      <img alt="PR合并率" src="https://img.shields.io/badge/PR_Merge_Rate-${formatPercent(stats.prMergeRate)}%25-A371F7?style=for-the-badge&logo=github&logoColor=white" />
    </td>
  </tr>
</table>

<sup>📅 统计更新于: ${currentDate}</sup>

</div>
<!-- END_GITHUB_STATS -->`
}

/**
 * 更新README文件
 */
async function updateReadme(readmePath: string, card: string): Promise<boolean> {
  try {
    // 检查README是否存在
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, card, 'utf8')
      return true
    }
    
    // 读取README内容
    const content = fs.readFileSync(readmePath, 'utf8')
    
    // 检查是否已存在统计卡片
    const regex = /<!-- BEGIN_GITHUB_STATS -->[\s\S]*<!-- END_GITHUB_STATS -->/
    
    let newContent: string
    let hasChanges = false
    
    if (regex.test(content)) {
      // 替换现有卡片
      const newContentAfterReplace = content.replace(regex, card)
      hasChanges = newContentAfterReplace !== content
      newContent = newContentAfterReplace
    } else {
      // 添加新卡片到文件末尾
      newContent = `${content}\n\n${card}`
      hasChanges = true
    }
    
    // 写入更新后的内容
    if (hasChanges) {
      fs.writeFileSync(readmePath, newContent, 'utf8')
    }
    
    return hasChanges
  } catch (error) {
    core.error(`更新README出错: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * 提交并推送更改
 */
async function commitAndPushChanges(readmePath: string, stats: GitHubStats): Promise<void> {
  try {
    core.info('正在提交统计卡片更新...')

    // 配置git
    await execAsync('git config user.name "GitHub Action Bot"')
    await execAsync('git config user.email "action@github.com"')
    
    // 添加更改
    await execAsync(`git add ${readmePath}`)
    
    // 提交更改
    const commitMessage = `更新 GitHub 统计卡片 [${stats.grade}级别, ${stats.score}分]`
    await execAsync(`git commit -m "${commitMessage}"`)
    
    // 推送更改
    await execAsync('git push')
    
    core.info('已成功提交并推送更改')
  } catch (error) {
    core.warning(`提交更改出错: ${error instanceof Error ? error.message : String(error)}`)
    core.warning('请确保GitHub Token有足够权限或在工作流中手动提交更改')
  }
}
