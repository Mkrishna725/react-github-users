import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const UseGlobalContext = () => React.useContext(GithubContext)

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [repos, setRepos] = useState(mockRepos)
  const [followers, setFollowers] = useState(mockFollowers)
  // request loading
  const [request, setRequest] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  // Error
  const [error, setError] = useState({ show: false, msg: '' })
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data
        setRequest(remaining)
        if (remaining === 0) {
          toggleError(true, 'Sorry, you have exceded your houlry limit')
        }
      })
      .catch((err) => console.log(err))
  }
  const searchGithubUser = async (user) => {
    setIsLoading(true)
    toggleError()
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) => {
      console.log(err)
    })
    if (response) {
      setGithubUser(response.data)

      const { login, followers_url } = response.data

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results
          const status = 'fulfilled'
          if (repos.status === status) {
            setRepos(repos.value.data)
          }
          if (followers.status === status) {
            setFollowers(followers.value.data)
          }
        })
        .catch((err) => console.log(err))
    } else {
      toggleError(true, 'There is no user that you entered')
    }
    checkRequests()
    setIsLoading(false)
  }
  function toggleError(show = false, msg = '') {
    setError({ show, msg })
  }
  useEffect(checkRequests, [])
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  )
}

export { GithubProvider, GithubContext, UseGlobalContext }