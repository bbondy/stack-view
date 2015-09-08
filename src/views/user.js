var React = require('react');
import {sites} from '../config.js';

const userUrl = (siteSlug, userId) => `/${siteSlug}/users/${userId}`;
const seUserUrl = (siteSlug, userId) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return `${foundSite.seUrl}users/${userId}`;
};

var User = React.createClass({
  render: function() {
    return <div><span>Posted by: </span>
      <a href={userUrl(this.props.siteSlug, this.props.id)}>{this.props.displayName}</a>
      <a href={seUserUrl(this.props.siteSlug, this.props.id)}><span className="se-backlink fa fa-stack-overflow"/></a>
  </div>;
  }
});

export default User;
