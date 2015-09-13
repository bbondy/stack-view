var React = require('react');
import User from './user.js';

var Answer = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
      <div dangerouslySetInnerHTML={{ __html: this.props.answer.body}}/>
      <span>Posted by:</span>
      <User id={this.props.answer.ownerUserId}
        siteSlug={this.props.siteSlug}
        lang={this.props.lang}
        displayName={this.props.answer.ownerDisplayName}/>
      <div>Score: {this.props.answer.score.toString()}</div>
      <div>Accepted: {this.props.isAccepted.toString()}</div>
    </div>;
  }
});

export default Answer;
