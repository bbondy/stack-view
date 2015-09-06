var React = require('react');
import {siteUrl} from '../config.js';

const userUrl = (userId) => `/users/${userId}`;
const seUserUrl = (userId) => `${siteUrl}users/${userId}`;

var UserView = React.createClass({
  render: function() {
    return <div><span>Posted by: </span>
      <a href={userUrl(this.props.id)}>{this.props.displayName}</a>
      <a href={seUserUrl(this.props.id)}><span className="se-backlink fa fa-stack-overflow"/></a>
  </div>;
  }
});

var Answer = React.createClass({
  render: function() {
    return <div>
      <hr/>
      <div>Accepted: {this.props.isAccepted.toString()}</div>
      <div>Score: {this.props.answer.score.toString()}</div>
      <UserView id={this.props.answer.ownerUserId}
        displayName={this.props.answer.ownerDisplayName}/>
      <div dangerouslySetInnerHTML={{ __html: this.props.answer.body}}/>
    </div>;
  }
});

var QuestionPage = React.createClass({
  render: function() {
    return <div>
      <h1>{this.props.question.title}</h1>
      <div>Score: {this.props.question.score.toString()}</div>
      <UserView id={this.props.question.ownerUserId}
        displayName={this.props.question.ownerDisplayName}/>
      <p dangerouslySetInnerHTML={{ __html: this.props.question.body}}/>
      {
        this.props.answers.map((answer) => <Answer key={answer.id}
          answer={answer}
          isAccepted={this.props.question.acceptedAnswerId === answer.id}/>)
      }
    </div>;
  }
});

var UserPage = React.createClass({
  render: function() {
    return <div>
      <h1>{this.props.user.displayName}</h1>
    </div>;
  }
});


var Main = React.createClass({
  componentWillMount: function() {
    if (this.props.answers && this.props.question) {
      const scoreAnswer = (answer) =>
        (answer.score || 0) + (this.props.question.acceptedAnswerId === answer.id ? 1000000 : 0);
      this.setState({
        answers: this.props.answers.sort((answer1, answer2) => scoreAnswer(answer2) - scoreAnswer(answer1))
      });
    }
  },
  render: function () {
    return <html>
      <head>
        <title>{this.props.title}</title>
        <link rel='stylesheet' href='/css/main.css'/>
        <link rel='stylesheet' href='/css/font-awesome/font-awesome.css'/>
     </head>
     <body>
     { this.props.question ? <QuestionPage question={this.props.question}
         answers={this.state.answers}/> : null }
     { this.props.user ? <UserPage user={this.props.user}/> : null }
     </body>
   </html>;
  }
});
module.exports = Main;