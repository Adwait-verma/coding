import axios from 'axios';

export async function fetchLeetCodeStats(username: string) {
  const response = await axios.get(`/api/leetcode/${username}`);
  return response.data;
}

export async function fetchGFGStats(username: string) {
  const response = await axios.get(`/api/gfg/${username}`);
  return response.data;
}

export async function fetchCodeforcesStats(handle: string) {
  const response = await axios.get(`/api/codeforces/${handle}`);
  return response.data;
}
