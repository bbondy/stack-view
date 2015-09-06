var React = require('react');
import UserPage from './userPage.js';
import QuestionPage from './questionPage.js';

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
