#!/usr/bin/env node
/**
 * This script subscribes all members of a collective (core contributors)
 * to the `group.monthlyreport` notification (for all collectives)
 */
import Promise from 'bluebird';
import models from '../server/models';
import _ from 'lodash';
import rp from 'request-promise';
const debug = require('debug')('export');

const processRows = (rows) => {
    console.log("#,groupid,slug,description,org/repo,stars,updatedAt");
    return Promise.map(rows, processRow);
};

const init = () => {
  const where = {
    $or: [
      { 'settings.githubRepo': { $ne: null } },
      { 'settings.githubOrg': { $ne: null } }
    ]
  }
  models.Group.findAll({where, limit: process.env.LIMIT})
  .then(processRows)
  .then(() => process.exit(0));
}

const fetchRepo = (repo) => {
  const uri = `https://api.github.com/repos/${repo}`;
  const rq = { uri,
      qs: {
        per_page: 100,
        sort: 'pushed',
        access_token: process.env.GITHUB_TOKEN,
        type: 'all',
        page: 1
      },
      headers: { 'User-Agent': 'OpenCollective' },
      json: true
  }
  return rp(rq).catch(e => {
      console.log("error: ", e);
    })
}

const processRepo = (repoData) => {
  return {
    stars: repoData.stargazers_count,
    updatedAt: repoData.updated_at,
    url: repoData.url
  }
}

const fetchOrgRepos = (org) => {
  const uri = `https://api.github.com/orgs/${org}/repos`;
  const rq = { uri,
      qs: {
        per_page: 100,
        sort: 'pushed',
        access_token: process.env.GITHUB_TOKEN,
        type: 'all',
        page: 1
      },
      headers: { 'User-Agent': 'OpenCollective' },
      json: true
  }
  return rp(rq).catch(e => {
      console.log("error: ");
    })
}

const format = (arr) => {
  const str = `"${arr.join('","')}"`;
  console.log(str);
}

const processRow = (row, index) => {

  let repos = []
  if (row.settings.githubOrg) {
    return fetchOrgRepos(row.settings.githubOrg).then((repos) => {
      const results = _.map(repos, processRepo);
      const stars = _.reduce(results, (memo, b) => memo + b.stars, 0);
      const updatedAt = _.max(results, (r) => new Date(r.updatedAt)).updatedAt;
      format([index, row.id, row.slug, row.description || row.mission, row.settings.githubOrg, stars, updatedAt]);
    });
  } else if (row.settings.githubRepo) {
    return fetchRepo(row.settings.githubRepo).then(processRepo).then(repo => {
      format([index, row.id, row.slug, row.description || row.mission, row.settings.githubRepo, repo.stars, repo.updatedAt]);
    });
  }
};

init();
