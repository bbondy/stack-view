var React = require('react');

import Answer from './answer.js';
import User from './user.js';

var Question = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
      <h1>{this.props.question.title}</h1>
      <p dangerouslySetInnerHTML={{ __html: this.props.question.body}}/>
      <User id={this.props.question.ownerUserId}
        siteSlug={this.props.siteSlug}
        lang={this.props.lang}
        displayName={this.props.question.ownerDisplayName}/>
      <div>Score: {this.props.question.score.toString()}</div>
    </div>;
  }
});

var Answers = React.createClass({
  render: function() {
    return <div>
      {
        this.props.answers.map((answer) => <Answer key={answer.id}
          siteSlug={this.props.siteSlug}
          answer={answer}
          lang={this.props.lang}
          isAccepted={this.props.question.acceptedAnswerId === answer.id}/>)
      }
    </div>;
  }
});

var QuestionPage = React.createClass({
  render: function() {
    return <div>
      <Question question={this.props.question}
        siteSlug={this.props.siteSlug}
        lang={this.props.lang}/>
      <Answers answers={this.props.answers}
        question={this.props.question}
        siteSlug={this.props.siteSlug}
        lang={this.props.lang}/>
    </div>;
  }
});

export default QuestionPage;
