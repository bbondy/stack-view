var React = require('react');

import Answer from './answer.js';
import User from './user.js';

var QuestionPage = React.createClass({
  render: function() {
    return <div>
      <h1>{this.props.question.title}</h1>
      <div>Score: {this.props.question.score.toString()}</div>
      <User id={this.props.question.ownerUserId}
        siteSlug={this.props.siteSlug}
        displayName={this.props.question.ownerDisplayName}/>
      <p dangerouslySetInnerHTML={{ __html: this.props.question.body}}/>
      {
        this.props.answers.map((answer) => <Answer key={answer.id}
          siteSlug={this.props.siteSlug}
          answer={answer}
          isAccepted={this.props.question.acceptedAnswerId === answer.id}/>)
      }
    </div>;
  }
});

export default QuestionPage;
