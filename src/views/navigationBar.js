var React = require('react');
import {userUrl, questionUrl, tagsUrl} from '../siteUtil.js';

var NavigationBar = React.createClass({
  render: function() {
    return <ul className='navigationBar'>
      <li><a href={questionUrl(this.props.siteSlug, this.props.lang)}>Questions</a></li>
      <li><a href={tagsUrl(this.props.siteSlug, this.props.lang)}>Tags</a></li>
      <li><a href={userUrl(this.props.siteSlug, this.props.lang)}>Users</a></li>
    </ul>;
  }
});

export default NavigationBar;
