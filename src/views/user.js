var React = require('react');
import {userUrl, seUserUrl} from '../siteUtil.js';

var User = React.createClass({
  render: function() {
    return <div><span>Posted by: </span>
      { !this.props.id ? <span>community wiki</span> : <span>
          <a href={userUrl(this.props.siteSlug, this.props.lang, this.props.id)}>{this.props.displayName}</a>
          <a href={seUserUrl(this.props.siteSlug, this.props.id)}><span className="se-backlink fa fa-stack-overflow"/></a>
      </span>
      }
  </div>;
  }
});

export default User;
