import { Controller } from '@hotwired/stimulus'

// Connects to data-controller="created_password_reset"
export default class extends Controller {
  connect(event) {
    location.reload();
  }
}
