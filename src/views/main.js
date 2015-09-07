var React = require('react');
import UserPage from './userPage.js';
import QuestionPage from './questionPage.js';
import TagPage from './tagPage.js';

var Main = React.createClass({
  render: function () {
    return <html>
      <head>
        <title>{this.props.title}</title>
        <link rel='stylesheet' href='/css/main.css'/>
        <link rel='stylesheet' href='/css/font-awesome/font-awesome.css'/>
     </head>
     <body>
     { this.props.question ? <QuestionPage question={this.props.question}
         answers={this.props.answers}/> : null }
     { this.props.user ? <UserPage user={this.props.user}/> : null }
     { this.props.tags ? <TagPage tags={this.props.tags}/> : null }
     </body>
   </html>;
  }
});
module.exports = Main;
