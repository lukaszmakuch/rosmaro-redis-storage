module.exports = () => {

  let pexpire_log = []

  let data = {}

  let async_actions = []

  let error_to_throw

  const fail_with = err => error_to_throw = err

  const fix = () => error_to_throw = null

  const tick = () => {
    const [head] = async_actions
    if (head) {
      head()
      //we're not fetching the tail earlier, because calling the head
      //could add some async action to the queue
      async_actions = async_actions.slice(1)
    }
  }

  const pexpire = (key, milliseconds, cb) => {
    async_actions.push(() => {
      if (error_to_throw) {
        if (cb) cb(error_to_throw)
      } else {
        pexpire_log.push([key, milliseconds])
        if (cb) cb(null)
      }
    })
  }

  const set = (key, value, cb) => {
    async_actions.push(() => {
      if (error_to_throw) {
        if (cb) cb(error_to_throw)
      } else {
        data[key] = value
        if (cb) cb(null)
      }
    })
  }

  const get = (key, cb) => {
    async_actions.push(() => {
      if (error_to_throw) {
        if (cb) cb(error_to_throw)
      } else {
        const read_data = data[key] ? data[key] : null
        if(cb) cb(null, read_data)
      }
    })
  }

  const del = (key, cb) => {
    async_actions.push(() => {
      if (error_to_throw) {
        if (cb) cb(error_to_throw)
      } else {
        delete data[key]
        if(cb) cb(null)
      }
    })
  }

  return { data, tick, set, get, del, fix, fail_with, pexpire, pexpire_log }
}
