import React from 'react';
import ReactDOM from 'react-dom';
export default class Notifications extends React.Component {
  constructor(props) {
    super(props);
    //this.handleChange = this.handleChange.bind(this);
    //this.handleSubmit = this.handleSubmit.bind(this);
  }
  render() {
    console.log("this props in notifiaction comming from the get requesrt", this.props);
    return (
      <span className='notifications'>
        <NotificationButton />
        <NotificationMenu />
      </span>
    );
  }
}

class NotificationButton extends React.Component {
  render() {
    return (
      <a className="dropdown-toggle electric-blue-text-color" id="notification-icon" href="#notifications" data-toggle="dropdown" onclick='$.post("/notification",{action:"see"});'>
        <span className="number-label" id="notification-label">{"1"}</span>
        <i className="nav-icon fa fa-globe"></i>
        <span className="nav-icon-text">Notifications</span>
      </a>
    );
  }
}

class NotificationMenu extends React.Component {
  render() {
    return (
      <span>
        {this.props.notifications.map((notification, i) => <Notification notification={notification} key={i} />)}
        <div className="more-notifications"></div><a className="dropdown-item" id="allow-push" href="#"></a>
      </span>
    );
  }
}

class Notification extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    let icon;
    let salaryDisplay;
    if(this.props.notification.salary) {
      if(this.props.notification.salary.change > 0) icon = <i className="fa fa-arrow-circle-up"></i>
      else icon = <i className="fa fa-arrow-circle-down"></i>
      salaryDisplay = <div className="notifiaction-salary-stats" style={{color: this.props.notification.salary.color}}>
                        <span className="notifiaction-salary">{this.props.notification.salary.new+" "}</span>
                        <span className="notifiaction-change">{this.props.notification.salary.change+" "}</span>
                        <span className="notifiaction-change-icon">{icon}</span>
                        <span className="notifiaction-percentage">{this.props.notification.salary.percent+"%"}</span>
                      </div>
    } else salaryDisplay = null;

    return (
      <span>
      <a className="dropdown-item notification" href={'/profile/'+this.props.notification.from} id={this.props.notification.id} onclick='$.post("/notification", {action:"click", id : this.id})'>
          <img className="notification-img" src={'/images/profile/'+this.props.notification.from+'.png'}/>
          <div className="notifiaction-content">
            <div className="notifiaction-text">{this.props.notification.notification}</div>
            {salaryDisplay}
            <div className="notifiaction-from">{this.props.notification.from}</div>
            <div className="notification-time">{this.props.notification.time}</div>
          </div>
        </a>
        <div className="dropdown-divider"></div>        
        </span>
    );
  }
}
$.get("/notification").done(response => {      
  if(response.notifications) {
    ReactDOM.render(<NotificationMenu notifications={response.notifications.notifications}/>, document.getElementById('notification-dropdown'));
    if(response.notifications.unseen) $('#notification-label').text(response.notifications.unseen);
    console.log("Logging unseen", response.notifications.unseen);
  }
}); 