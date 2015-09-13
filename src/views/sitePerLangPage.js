var React = require('react');
import {userUrl, questionUrl, tagsUrl} from '../siteUtil.js';

var SitePerLangPage = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
    <h1>{this.props.title}</h1>
    <div><a href={questionUrl(this.props.siteSlug, this.props.lang)}>Questions</a></div>
    <div><a href={userUrl(this.props.siteSlug, this.props.lang)}>Users</a></div>
    <div><a href={tagsUrl(this.props.siteSlug, this.props.lang)}>Tags</a></div>
    </div>;
  }
});

export default SitePerLangPage;
