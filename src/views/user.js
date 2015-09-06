var React = require('react');
import {siteUrl} from '../config.js';

const userUrl = (userId) => `/users/${userId}`;
const seUserUrl = (userId) => `${siteUrl}users/${userId}`;

var User = React.createClass({
  render: function() {
    return <div><span>Posted by: </span>
      <a href={userUrl(this.props.id)}>{this.props.displayName}</a>
      <a href={seUserUrl(this.props.id)}><span className="se-backlink fa fa-stack-overflow"/></a>
  </div>;
  }
});

export default User;
