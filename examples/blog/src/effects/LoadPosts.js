import PostLoaded from "../mutations/PostLoaded";
import { posts } from "../services/api";

export default function LoadPosts(payload, { dispatch, state }) {
  return dispatch(
    PostLoaded,
    posts.getMany({ pagination: state.pagination, filter: state.filter })
  );
}
