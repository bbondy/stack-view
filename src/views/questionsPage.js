var React = require('react');
import {getQuestionsTitle, questionUrl, nextQuestionsUrl, backQuestionsUrl} from '../siteUtil.js';
import {BackButton, NextButton} from './navigation.js';
import {questionsPerPage} from '../config.js';

var Question = React.createClass({
  render: function() {
    return <div>
      <a href={questionUrl(this.props.siteSlug, this.props.lang, this.props.question.id)}>{this.props.question.title} (Weight: {this.props.question.weight})</a>
    </div>;
  }
});

var QuestionsPage = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
      <h1>{getQuestionsTitle(this.props.lang, this.props.page)}</h1>
      {
        this.props.questions.map(question => <Question key={question.id}
          siteSlug={this.props.siteSlug}
          question={question}
          lang={this.props.lang} />)
      }

      { this.props.page > 1 ?
        <BackButton href={backQuestionsUrl(this.props.siteSlug, this.props.lang, this.props.page)}/> : null }
      { this.props.questions.length >= questionsPerPage ?
        <NextButton href={nextQuestionsUrl(this.props.siteSlug, this.props.lang, this.props.page)}/> : null }
    </div>;
  }
});

export default QuestionsPage;

