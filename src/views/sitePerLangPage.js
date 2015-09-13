var React = require('react');
import {userUrl, questionUrl} from '../urlUtil.js';

var SitePerLangPage = React.createClass({
  render: function() {
    return <div>
    <h1>{this.props.title}</h1>
    <div><a href={questionUrl(this.props.siteSlug, this.props.lang)}>Questions</a></div>
    <div><a href={userUrl(this.props.siteSlug, this.props.lang)}>Users</a></div>
    </div>;
  }
});

export default SitePerLangPage;
