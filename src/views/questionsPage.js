var React = require('react');
import {questionUrl} from '../urlUtil.js';

var Question = React.createClass({
  render: function() {
    return <div>
      <a href={questionUrl(this.props.siteSlug, this.props.lang, this.props.question.id)}>{this.props.question.title}</a>
    </div>;
  }
});

var QuestionsPage = React.createClass({
  render: function() {
    return <div>
      <h1>Questions</h1>
      {
        this.props.questions.map(question => <Question key={question.id}
          siteSlug={this.props.siteSlug}
          question={question}
          lang={this.props.lang} />)
      }
    </div>;
  }
});

export default QuestionsPage;

