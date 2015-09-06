var React = require('react');
import {siteUrl} from '../config.js';

const userUrl = (userId) => `${siteUrl}/users/${userId}`;

var UserView = React.createClass({
  render: function() {
    return <div>Posted by:
      <a href={userUrl(this.props.id)}>{this.props.displayName}</a>
      <span className="fa fa-stack-overflow"></span>
  </div>;
  }
});

var Answer = React.createClass({
  render: function() {
    return <div>
      <hr/>
      <UserView id={this.props.answer.ownerUserId}
        displayName={this.props.answer.ownerDisplayName}/>
      <div dangerouslySetInnerHTML={{ __html: this.props.answer.body}}/>
    </div>;
  }
});

var Main = React.createClass({
  componentDidMount: function() {
  },
  render: function () {
    return <html>
      <head>
        <title>{this.props.title}</title>
        <link rel='stylesheet' href='/css/main.css'/>
        <link rel='stylesheet' href='/css/font-awesome/font-awesome.css'/>
     </head>
     <body>
       <h1>{this.props.question.title}</h1>
      <UserView id={this.props.question.ownerUserId}
        displayName={this.props.question.ownerDisplayName}/>
       <p dangerouslySetInnerHTML={{ __html: this.props.question.body}}/>
       {
         this.props.answers.map((answer) => <Answer key={answer.id} answer={answer} />)
       }
     </body>
   </html>;
  }
});
module.exports = Main;
