import { eventService } from 'services/event';
import React, { Component } from 'react'

class Events extends Component {
  constructor (props) {
    super(props)
    this.state = {
      events: [{name: "Loading...", id:1}],
      selected: 0
    }
  }

  componentDidMount () {
    eventService.getEvents().subscribe( ( events ) => {
      this.setState(Object.assign({}, this.state, { events: events }),()=>{
        this.selected = events[0]
      })
    })
  }
  set selected(event){
    this.setState(Object.assign({},this.state,{ selected: event }))
    if(this.props.onEventChanged){
      this.props.onEventChanged(event)
    }
  }
  appendMDL(ref){
    if(ref){
      componentHandler.upgradeElement(ref)
    }
  }
  render () {
    let eventButtons = []
    for(let event of this.state.events){
      let btnClass = 'mdl-button mdl-button--accent'
      if(this.state.selected.id === event.id){
        btnClass += ' mdl-button--raised'
      }
      eventButtons.push(
        <a ref={(a) => this.appendMDL(a)} className={btnClass} onClick={ () => {this.selected = event} } key={event.id}>{event.name}</a>
      )
    }

    return (
      <div>
        <h3>Arrangementer</h3>
        <div className='event-button-div'>
          { eventButtons }
        </div>
      </div>
    )
  }
}

export default Events
